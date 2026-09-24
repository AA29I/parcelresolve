export interface SlaCalculationParams {
  dispatchDate: Date;
  cutoffTime?: string; // e.g. "16:00"
  slaHours: number; // e.g. 24, 48, 72
  calendarType?: 'BUSINESS_DAYS' | 'CALENDAR_DAYS';
  weekendHandling?: 'SKIP_WEEKENDS' | 'INCLUDE_WEEKENDS';
  nationalHolidays?: string[]; // array of "YYYY-MM-DD"
  currentCheckTime?: Date;
  deliveryDate?: Date | null;
}

export interface SlaCalculationResult {
  promisedDeliveryDate: Date;
  isBreached: boolean;
  breachHours: number;
  calculationDetail: string;
}

/**
 * Checks if a given date falls on a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Checks if a given date matches any holiday in YYYY-MM-DD
 */
export function isHoliday(date: Date, holidays: string[] = []): boolean {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const formatted = `${yyyy}-${mm}-${dd}`;
  return holidays.includes(formatted);
}

/**
 * Formats a Date nicely for human-readable audit calculations
 */
function formatDateAudit(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[date.getDay()];
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dayName} ${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

/**
 * Calculates promised delivery deadline and breach metrics with audit breakdown
 */
export function calculateSla(params: SlaCalculationParams): SlaCalculationResult {
  const {
    dispatchDate,
    cutoffTime = '16:00',
    slaHours,
    calendarType = 'BUSINESS_DAYS',
    weekendHandling = 'SKIP_WEEKENDS',
    nationalHolidays = [],
    currentCheckTime = new Date(),
    deliveryDate = null,
  } = params;

  const dispatch = new Date(dispatchDate);
  const [cutoffHour, cutoffMinute] = cutoffTime.split(':').map(Number);

  const steps: string[] = [];
  steps.push(`1. Dispatched: ${formatDateAudit(dispatch)}.`);

  // Check if dispatch occurred after the cutoff time
  const dispatchHour = dispatch.getHours();
  const dispatchMin = dispatch.getMinutes();
  const isAfterCutoff =
    dispatchHour > cutoffHour || (dispatchHour === cutoffHour && dispatchMin > cutoffMinute);

  let cursor = new Date(dispatch);

  if (isAfterCutoff) {
    steps.push(`2. Dispatch occurred after ${cutoffTime} cutoff; SLA start advanced to next dispatch window.`);
    // Advance to next calendar day at 09:00 AM
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(9, 0, 0, 0);
  } else {
    steps.push(`2. Met ${cutoffTime} cutoff; SLA clock started from dispatch time.`);
  }

  // If weekend or holiday at start, advance cursor to the first valid business day
  if (calendarType === 'BUSINESS_DAYS' && weekendHandling === 'SKIP_WEEKENDS') {
    while (isWeekend(cursor) || isHoliday(cursor, nationalHolidays)) {
      const reason = isWeekend(cursor) ? 'weekend' : 'national holiday';
      steps.push(`   - Advanced past ${reason} on ${formatDateAudit(cursor)}.`);
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(9, 0, 0, 0);
    }
  }

  // Calculate deadline
  if (calendarType === 'CALENDAR_DAYS' || weekendHandling === 'INCLUDE_WEEKENDS') {
    cursor = new Date(cursor.getTime() + slaHours * 60 * 60 * 1000);
    steps.push(`3. Calendar SLA of ${slaHours} hours applied directly.`);
  } else {
    // Business days: each 24h block corresponds to 1 business day
    const businessDaysToAdd = Math.ceil(slaHours / 24);
    const remainderHours = slaHours % 24;
    steps.push(`3. SLA: ${slaHours}h (${businessDaysToAdd} business days, business hours calculation).`);

    let daysAdded = 0;
    while (daysAdded < businessDaysToAdd) {
      cursor.setDate(cursor.getDate() + 1);
      if (!isWeekend(cursor) && !isHoliday(cursor, nationalHolidays)) {
        daysAdded++;
      } else {
        steps.push(`   - Skipped non-business day: ${formatDateAudit(cursor)}.`);
      }
    }

    if (remainderHours > 0) {
      cursor = new Date(cursor.getTime() + remainderHours * 60 * 60 * 1000);
    }
    // Set standard close of business (e.g. 18:00) on final delivery date
    cursor.setHours(18, 0, 0, 0);
  }

  const promisedDeliveryDate = new Date(cursor);
  steps.push(`4. Final Promised Delivery Deadline: ${formatDateAudit(promisedDeliveryDate)}.`);

  // Determine breach
  const referenceTime = deliveryDate ? new Date(deliveryDate) : currentCheckTime;
  const diffMs = referenceTime.getTime() - promisedDeliveryDate.getTime();
  const breachHours = diffMs > 0 ? parseFloat((diffMs / (1000 * 60 * 60)).toFixed(1)) : 0;
  const isBreached = breachHours > 0;

  if (isBreached) {
    if (deliveryDate) {
      steps.push(`5. BREACHED: Delivered late at ${formatDateAudit(deliveryDate)} by ${breachHours} hours.`);
    } else {
      steps.push(`5. BREACHED: Undelivered as of ${formatDateAudit(currentCheckTime)}. Overdue by ${breachHours} hours.`);
    }
  } else {
    const hoursRemaining = parseFloat((Math.abs(diffMs) / (1000 * 60 * 60)).toFixed(1));
    steps.push(`5. ON TIME: ${deliveryDate ? 'Delivered before deadline.' : `${hoursRemaining} hours remaining.`}`);
  }

  return {
    promisedDeliveryDate,
    isBreached,
    breachHours,
    calculationDetail: steps.join('\n'),
  };
}
