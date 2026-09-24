
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.21.1
 * Query Engine version: bf0e5e8a04cada8225617067eaa03d041e2bba36
 */
Prisma.prismaVersion = {
  client: "5.21.1",
  engine: "bf0e5e8a04cada8225617067eaa03d041e2bba36"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.OrganizationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  logoUrl: 'logoUrl',
  primaryContactEmail: 'primaryContactEmail',
  phone: 'phone',
  operatingCountries: 'operatingCountries',
  operatingCurrencies: 'operatingCurrencies',
  defaultCurrency: 'defaultCurrency',
  timezone: 'timezone',
  subscriptionTier: 'subscriptionTier',
  subscriptionStatus: 'subscriptionStatus',
  parcelMonthlyLimit: 'parcelMonthlyLimit',
  claimMonthlyLimit: 'claimMonthlyLimit',
  onboardingStep: 'onboardingStep',
  onboardingCompleted: 'onboardingCompleted',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  email: 'email',
  passwordHash: 'passwordHash',
  role: 'role',
  authProvider: 'authProvider',
  googleId: 'googleId',
  phone: 'phone',
  isActive: 'isActive',
  avatarUrl: 'avatarUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PasswordResetTokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  email: 'email',
  tokenHash: 'tokenHash',
  expiresAt: 'expiresAt',
  usedAt: 'usedAt',
  createdAt: 'createdAt'
};

exports.Prisma.WarehouseScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  code: 'code',
  name: 'name',
  addressLine1: 'addressLine1',
  addressLine2: 'addressLine2',
  city: 'city',
  state: 'state',
  postalCode: 'postalCode',
  country: 'country',
  cutoffTime: 'cutoffTime',
  timezone: 'timezone',
  isDefault: 'isDefault',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CarrierScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  code: 'code',
  name: 'name',
  category: 'category',
  connectionType: 'connectionType',
  capabilities: 'capabilities',
  aggregatorId: 'aggregatorId',
  contractedParty: 'contractedParty',
  physicalCarrier: 'physicalCarrier',
  finalMileCarrier: 'finalMileCarrier',
  enquiryRecipientEmail: 'enquiryRecipientEmail',
  claimRecipientEmail: 'claimRecipientEmail',
  accountCredentials: 'accountCredentials',
  isLive: 'isLive',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CarrierMappingScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  carrierId: 'carrierId',
  inputCourierName: 'inputCourierName',
  inputServiceName: 'inputServiceName',
  mappedCourierCode: 'mappedCourierCode',
  mappedServiceCode: 'mappedServiceCode',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CarrierConnectorScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  carrierId: 'carrierId',
  name: 'name',
  version: 'version',
  status: 'status',
  authType: 'authType',
  baseUrl: 'baseUrl',
  trackingEndpoint: 'trackingEndpoint',
  headersTemplate: 'headersTemplate',
  queryParamsTemplate: 'queryParamsTemplate',
  trackingNumberParam: 'trackingNumberParam',
  responseStatusPath: 'responseStatusPath',
  responseTimestampPath: 'responseTimestampPath',
  responseLocationPath: 'responseLocationPath',
  responseMessagePath: 'responseMessagePath',
  responseEventsArrayPath: 'responseEventsArrayPath',
  statusCodeMap: 'statusCodeMap',
  minPollIntervalMinutes: 'minPollIntervalMinutes',
  maxCallsPerMinute: 'maxCallsPerMinute',
  backoffStrategy: 'backoffStrategy',
  sampleTrackingNumber: 'sampleTrackingNumber',
  testSuccess: 'testSuccess',
  lastTestedAt: 'lastTestedAt',
  testResultPayload: 'testResultPayload',
  publishedAt: 'publishedAt',
  rollbackVersionId: 'rollbackVersionId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LinnworksConnectionScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  applicationId: 'applicationId',
  applicationSecret: 'applicationSecret',
  authorizationToken: 'authorizationToken',
  tokenExpiresAt: 'tokenExpiresAt',
  serverUrl: 'serverUrl',
  isConnected: 'isConnected',
  syncStatus: 'syncStatus',
  lastSyncAt: 'lastSyncAt',
  autoSyncEnabled: 'autoSyncEnabled',
  syncIntervalMinutes: 'syncIntervalMinutes',
  lastError: 'lastError',
  syncProvenance: 'syncProvenance',
  backfillCompleted: 'backfillCompleted',
  ordersSyncedCount: 'ordersSyncedCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ParcelScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  warehouseId: 'warehouseId',
  carrierId: 'carrierId',
  orderNumber: 'orderNumber',
  packageId: 'packageId',
  trackingNumber: 'trackingNumber',
  secondaryTrackingNumber: 'secondaryTrackingNumber',
  recipientName: 'recipientName',
  recipientEmail: 'recipientEmail',
  recipientPhone: 'recipientPhone',
  recipientAddress: 'recipientAddress',
  recipientCity: 'recipientCity',
  recipientState: 'recipientState',
  recipientPostalCode: 'recipientPostalCode',
  recipientCountry: 'recipientCountry',
  destinationZone: 'destinationZone',
  weightKg: 'weightKg',
  lengthCm: 'lengthCm',
  widthCm: 'widthCm',
  heightCm: 'heightCm',
  declaredValue: 'declaredValue',
  currency: 'currency',
  itemsSummary: 'itemsSummary',
  shippingCost: 'shippingCost',
  dispatchDate: 'dispatchDate',
  promisedDeliveryDate: 'promisedDeliveryDate',
  calculatedSlaHours: 'calculatedSlaHours',
  slaCutoffUsed: 'slaCutoffUsed',
  slaCalculationDetail: 'slaCalculationDetail',
  isBreached: 'isBreached',
  breachHours: 'breachHours',
  stalledHours: 'stalledHours',
  trackingStatus: 'trackingStatus',
  investigationStatus: 'investigationStatus',
  claimStatus: 'claimStatus',
  recoveryStatus: 'recoveryStatus',
  claimedAmount: 'claimedAmount',
  approvedAmount: 'approvedAmount',
  recoveredAmount: 'recoveredAmount',
  creditNoteNumber: 'creditNoteNumber',
  latestStatusDescription: 'latestStatusDescription',
  lastPhysicalScanAt: 'lastPhysicalScanAt',
  lastScanLocation: 'lastScanLocation',
  lastEventTime: 'lastEventTime',
  lastApiCheckAt: 'lastApiCheckAt',
  source: 'source',
  customFieldValues: 'customFieldValues',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RawTrackingEventScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  parcelId: 'parcelId',
  trackingNumber: 'trackingNumber',
  rawPayload: 'rawPayload',
  httpStatusCode: 'httpStatusCode',
  source: 'source',
  headers: 'headers',
  receivedAt: 'receivedAt'
};

exports.Prisma.TrackingEventScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  parcelId: 'parcelId',
  eventCode: 'eventCode',
  normalizedStatus: 'normalizedStatus',
  statusDescription: 'statusDescription',
  locationCity: 'locationCity',
  locationState: 'locationState',
  locationCountry: 'locationCountry',
  latitude: 'latitude',
  longitude: 'longitude',
  eventTimestamp: 'eventTimestamp',
  carrierEventId: 'carrierEventId',
  isPhysicalScan: 'isPhysicalScan',
  signatureUrl: 'signatureUrl',
  podImageUrl: 'podImageUrl',
  isDuplicate: 'isDuplicate',
  createdAt: 'createdAt'
};

exports.Prisma.SlaPolicyScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  carrierId: 'carrierId',
  serviceCode: 'serviceCode',
  aggregatorContract: 'aggregatorContract',
  originCountry: 'originCountry',
  destinationCountry: 'destinationCountry',
  destinationZone: 'destinationZone',
  minWeightKg: 'minWeightKg',
  maxWeightKg: 'maxWeightKg',
  slaHours: 'slaHours',
  cutoffTime: 'cutoffTime',
  calendarType: 'calendarType',
  weekendHandling: 'weekendHandling',
  nationalHolidays: 'nationalHolidays',
  version: 'version',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CarrierEnquiryScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  parcelId: 'parcelId',
  carrierId: 'carrierId',
  referenceNumber: 'referenceNumber',
  enquiryType: 'enquiryType',
  status: 'status',
  sendingMode: 'sendingMode',
  recipientEmail: 'recipientEmail',
  subject: 'subject',
  body: 'body',
  sentAt: 'sentAt',
  lastReplyAt: 'lastReplyAt',
  replyCount: 'replyCount',
  internalNotes: 'internalNotes',
  followUpDueDate: 'followUpDueDate',
  followUpSequenceCount: 'followUpSequenceCount',
  escalationTier: 'escalationTier',
  lastFollowUpSentAt: 'lastFollowUpSentAt',
  assignedUserId: 'assignedUserId',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EnquiryMessageScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  enquiryId: 'enquiryId',
  senderType: 'senderType',
  senderEmail: 'senderEmail',
  senderName: 'senderName',
  messageBody: 'messageBody',
  attachments: 'attachments',
  messageTimestamp: 'messageTimestamp'
};

exports.Prisma.ClaimScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  parcelId: 'parcelId',
  carrierId: 'carrierId',
  claimNumber: 'claimNumber',
  carrierClaimReference: 'carrierClaimReference',
  reason: 'reason',
  status: 'status',
  claimedAmount: 'claimedAmount',
  approvedAmount: 'approvedAmount',
  recoveredAmount: 'recoveredAmount',
  currency: 'currency',
  filingDeadline: 'filingDeadline',
  earliestFilingDate: 'earliestFilingDate',
  submittedAt: 'submittedAt',
  decidedAt: 'decidedAt',
  settledAt: 'settledAt',
  denialReason: 'denialReason',
  appealCount: 'appealCount',
  creditNoteReference: 'creditNoteReference',
  declarationText: 'declarationText',
  assignedUserId: 'assignedUserId',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClaimDocumentScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  claimId: 'claimId',
  parcelId: 'parcelId',
  documentType: 'documentType',
  fileName: 'fileName',
  fileUrl: 'fileUrl',
  fileSize: 'fileSize',
  mimeType: 'mimeType',
  isGeneratedDeclaration: 'isGeneratedDeclaration',
  disclaimerText: 'disclaimerText',
  uploadedAt: 'uploadedAt'
};

exports.Prisma.CustomFieldScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  entityType: 'entityType',
  fieldKey: 'fieldKey',
  fieldLabel: 'fieldLabel',
  fieldType: 'fieldType',
  options: 'options',
  isRequired: 'isRequired',
  isSearchable: 'isSearchable',
  roleVisibility: 'roleVisibility',
  createdAt: 'createdAt'
};

exports.Prisma.CustomStatusMappingScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  entityType: 'entityType',
  customLabel: 'customLabel',
  coreStatus: 'coreStatus',
  colorCode: 'colorCode',
  isDefault: 'isDefault',
  createdAt: 'createdAt'
};

exports.Prisma.WorkflowRuleScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  description: 'description',
  triggerEvent: 'triggerEvent',
  conditions: 'conditions',
  actions: 'actions',
  requiresApproval: 'requiresApproval',
  isActive: 'isActive',
  version: 'version',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkflowVersionScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  workflowRuleId: 'workflowRuleId',
  versionNumber: 'versionNumber',
  snapshot: 'snapshot',
  changeNotes: 'changeNotes',
  createdById: 'createdById',
  createdAt: 'createdAt'
};

exports.Prisma.ApiKeyScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  keyPrefix: 'keyPrefix',
  keyHash: 'keyHash',
  scopes: 'scopes',
  lastUsedAt: 'lastUsedAt',
  expiresAt: 'expiresAt',
  isActive: 'isActive',
  createdById: 'createdById',
  createdAt: 'createdAt'
};

exports.Prisma.OutboundWebhookScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  targetUrl: 'targetUrl',
  secretKey: 'secretKey',
  events: 'events',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.WebhookDeliveryScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  webhookId: 'webhookId',
  eventType: 'eventType',
  payload: 'payload',
  httpStatus: 'httpStatus',
  responseBody: 'responseBody',
  signatureSent: 'signatureSent',
  isSuccess: 'isSuccess',
  retryCount: 'retryCount',
  deliveredAt: 'deliveredAt'
};

exports.Prisma.ImportBatchScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  fileName: 'fileName',
  fileFormat: 'fileFormat',
  totalRows: 'totalRows',
  processedRows: 'processedRows',
  successRows: 'successRows',
  errorRows: 'errorRows',
  errorLog: 'errorLog',
  mappingTemplateName: 'mappingTemplateName',
  fieldMapping: 'fieldMapping',
  status: 'status',
  createdById: 'createdById',
  createdAt: 'createdAt'
};

exports.Prisma.ExportLayoutScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  name: 'name',
  entityType: 'entityType',
  selectedColumns: 'selectedColumns',
  filterPreset: 'filterPreset',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  userId: 'userId',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  details: 'details',
  ipAddress: 'ipAddress',
  createdAt: 'createdAt'
};

exports.Prisma.JobQueueScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  taskType: 'taskType',
  payload: 'payload',
  status: 'status',
  attempts: 'attempts',
  maxAttempts: 'maxAttempts',
  lastError: 'lastError',
  runAfter: 'runAfter',
  lockedAt: 'lockedAt',
  completedAt: 'completedAt',
  createdAt: 'createdAt'
};

exports.Prisma.ClaimInvoiceScalarFieldEnum = {
  id: 'id',
  organizationId: 'organizationId',
  claimId: 'claimId',
  parcelId: 'parcelId',
  carrierId: 'carrierId',
  invoiceNumber: 'invoiceNumber',
  generationType: 'generationType',
  carrierFormat: 'carrierFormat',
  claimantName: 'claimantName',
  claimantAddress: 'claimantAddress',
  claimantTaxId: 'claimantTaxId',
  claimantContactEmail: 'claimantContactEmail',
  claimantPhone: 'claimantPhone',
  courierName: 'courierName',
  courierAccountNo: 'courierAccountNo',
  courierDeptEmail: 'courierDeptEmail',
  courierClaimRef: 'courierClaimRef',
  trackingNumber: 'trackingNumber',
  orderNumber: 'orderNumber',
  dispatchDate: 'dispatchDate',
  lossReason: 'lossReason',
  currency: 'currency',
  merchandiseValue: 'merchandiseValue',
  shippingCost: 'shippingCost',
  taxAmount: 'taxAmount',
  adminFeeAmount: 'adminFeeAmount',
  totalClaimedAmount: 'totalClaimedAmount',
  lineItems: 'lineItems',
  customFields: 'customFields',
  evidenceImages: 'evidenceImages',
  disclaimerText: 'disclaimerText',
  notes: 'notes',
  authorizedSignatory: 'authorizedSignatory',
  status: 'status',
  submittedAt: 'submittedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  Organization: 'Organization',
  User: 'User',
  PasswordResetToken: 'PasswordResetToken',
  Warehouse: 'Warehouse',
  Carrier: 'Carrier',
  CarrierMapping: 'CarrierMapping',
  CarrierConnector: 'CarrierConnector',
  LinnworksConnection: 'LinnworksConnection',
  Parcel: 'Parcel',
  RawTrackingEvent: 'RawTrackingEvent',
  TrackingEvent: 'TrackingEvent',
  SlaPolicy: 'SlaPolicy',
  CarrierEnquiry: 'CarrierEnquiry',
  EnquiryMessage: 'EnquiryMessage',
  Claim: 'Claim',
  ClaimDocument: 'ClaimDocument',
  CustomField: 'CustomField',
  CustomStatusMapping: 'CustomStatusMapping',
  WorkflowRule: 'WorkflowRule',
  WorkflowVersion: 'WorkflowVersion',
  ApiKey: 'ApiKey',
  OutboundWebhook: 'OutboundWebhook',
  WebhookDelivery: 'WebhookDelivery',
  ImportBatch: 'ImportBatch',
  ExportLayout: 'ExportLayout',
  AuditLog: 'AuditLog',
  JobQueue: 'JobQueue',
  ClaimInvoice: 'ClaimInvoice'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
