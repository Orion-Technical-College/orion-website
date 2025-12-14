BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000),
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'RECRUITER',
    [passwordHash] NVARCHAR(1000),
    [emailVerified] DATETIME2,
    [mustChangePassword] BIT NOT NULL CONSTRAINT [User_mustChangePassword_df] DEFAULT 0,
    [isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 0,
    [isInternal] BIT NOT NULL CONSTRAINT [User_isInternal_df] DEFAULT 0,
    [authProvider] NVARCHAR(1000),
    [authProviderId] NVARCHAR(1000),
    [clientId] NVARCHAR(1000),
    [createdBy] NVARCHAR(1000),
    [deletedAt] DATETIME2,
    [pushSubscription] TEXT,
    [googleMessagesApiKey] TEXT,
    [calendlyApiKey] TEXT,
    [zoomApiKey] TEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Client] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [domain] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [Client_isActive_df] DEFAULT 1,
    [deletedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Client_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Client_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Candidate] (
    [id] NVARCHAR(1000) NOT NULL,
    [clientId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000),
    [recruiterId] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000) NOT NULL,
    [source] NVARCHAR(1000),
    [jobTitle] NVARCHAR(1000),
    [location] NVARCHAR(1000),
    [date] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Candidate_status_df] DEFAULT 'PENDING',
    [notes] TEXT,
    [smsConsentStatus] NVARCHAR(1000) NOT NULL CONSTRAINT [Candidate_smsConsentStatus_df] DEFAULT 'UNKNOWN',
    [smsOptInAt] DATETIME2,
    [smsOptInSource] NVARCHAR(1000),
    [smsOptOutAt] DATETIME2,
    [smsOptOutReason] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Candidate_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Candidate_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Candidate_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[Campaign] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [calendlyUrl] NVARCHAR(1000),
    [zoomUrl] NVARCHAR(1000),
    [messageTemplate] TEXT NOT NULL,
    [reminderTimings] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Campaign_status_df] DEFAULT 'DRAFT',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Campaign_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Campaign_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CampaignRecipient] (
    [id] NVARCHAR(1000) NOT NULL,
    [campaignId] NVARCHAR(1000) NOT NULL,
    [candidateId] NVARCHAR(1000) NOT NULL,
    [personalizedMessage] TEXT NOT NULL,
    [sentAt] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [CampaignRecipient_status_df] DEFAULT 'PENDING',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CampaignRecipient_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [CampaignRecipient_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CampaignRecipient_campaignId_candidateId_key] UNIQUE NONCLUSTERED ([campaignId],[candidateId])
);

-- CreateTable
CREATE TABLE [dbo].[AuditLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [actorId] NVARCHAR(1000) NOT NULL,
    [actorRole] NVARCHAR(1000) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [targetId] NVARCHAR(1000),
    [targetType] NVARCHAR(1000),
    [metadata] TEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AuditLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AuditLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SystemSetting] (
    [id] NVARCHAR(1000) NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [value] TEXT NOT NULL,
    [description] NVARCHAR(1000),
    [isEnabled] BIT NOT NULL CONSTRAINT [SystemSetting_isEnabled_df] DEFAULT 1,
    [updatedBy] NVARCHAR(1000) NOT NULL,
    [updatedAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [SystemSetting_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [SystemSetting_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [SystemSetting_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[GuidedSendSession] (
    [id] NVARCHAR(1000) NOT NULL,
    [campaignId] NVARCHAR(1000) NOT NULL,
    [createdByUserId] NVARCHAR(1000) NOT NULL,
    [idempotencyKey] NVARCHAR(1000),
    [clientId] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [GuidedSendSession_status_df] DEFAULT 'ACTIVE',
    [templateSnapshot] TEXT NOT NULL,
    [templateVersion] INT NOT NULL CONSTRAINT [GuidedSendSession_templateVersion_df] DEFAULT 1,
    [variablesSnapshot] TEXT,
    [messagePolicy] NVARCHAR(1000) NOT NULL CONSTRAINT [GuidedSendSession_messagePolicy_df] DEFAULT 'LOCKED',
    [aiDraftMeta] TEXT,
    [currentIndex] INT NOT NULL CONSTRAINT [GuidedSendSession_currentIndex_df] DEFAULT 0,
    [lastActiveRecipientId] NVARCHAR(1000),
    [device] NVARCHAR(1000),
    [startedAt] DATETIME2,
    [completedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [GuidedSendSession_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [GuidedSendSession_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [GuidedSendSession_clientId_createdByUserId_idempotencyKey_key] UNIQUE NONCLUSTERED ([clientId],[createdByUserId],[idempotencyKey])
);

-- CreateTable
CREATE TABLE [dbo].[GuidedSendRecipient] (
    [id] NVARCHAR(1000) NOT NULL,
    [sessionId] NVARCHAR(1000) NOT NULL,
    [candidateId] NVARCHAR(1000) NOT NULL,
    [order] INT NOT NULL,
    [phoneRaw] NVARCHAR(1000),
    [phoneE164] NVARCHAR(1000),
    [renderedMessage] TEXT NOT NULL,
    [renderedFromTemplateVersion] INT NOT NULL CONSTRAINT [GuidedSendRecipient_renderedFromTemplateVersion_df] DEFAULT 1,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [GuidedSendRecipient_status_df] DEFAULT 'PENDING',
    [openedAt] DATETIME2,
    [openCount] INT NOT NULL CONSTRAINT [GuidedSendRecipient_openCount_df] DEFAULT 0,
    [lastOpenedAt] DATETIME2,
    [sentAt] DATETIME2,
    [skippedReason] NVARCHAR(1000),
    [blockedReason] NVARCHAR(1000),
    [audit] TEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [GuidedSendRecipient_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [GuidedSendRecipient_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [GuidedSendRecipient_sessionId_candidateId_key] UNIQUE NONCLUSTERED ([sessionId],[candidateId]),
    CONSTRAINT [GuidedSendRecipient_sessionId_order_key] UNIQUE NONCLUSTERED ([sessionId],[order])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_role_idx] ON [dbo].[User]([role]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_clientId_idx] ON [dbo].[User]([clientId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_isActive_idx] ON [dbo].[User]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_deletedAt_idx] ON [dbo].[User]([deletedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_authProvider_authProviderId_idx] ON [dbo].[User]([authProvider], [authProviderId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_isInternal_idx] ON [dbo].[User]([isInternal]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Client_isActive_idx] ON [dbo].[Client]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Client_deletedAt_idx] ON [dbo].[Client]([deletedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Candidate_userId_idx] ON [dbo].[Candidate]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Candidate_status_idx] ON [dbo].[Candidate]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Candidate_clientId_idx] ON [dbo].[Candidate]([clientId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Candidate_recruiterId_idx] ON [dbo].[Candidate]([recruiterId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Candidate_smsConsentStatus_idx] ON [dbo].[Candidate]([smsConsentStatus]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Campaign_userId_idx] ON [dbo].[Campaign]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Campaign_status_idx] ON [dbo].[Campaign]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CampaignRecipient_campaignId_idx] ON [dbo].[CampaignRecipient]([campaignId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CampaignRecipient_candidateId_idx] ON [dbo].[CampaignRecipient]([candidateId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CampaignRecipient_status_idx] ON [dbo].[CampaignRecipient]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_actorId_idx] ON [dbo].[AuditLog]([actorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_action_idx] ON [dbo].[AuditLog]([action]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_createdAt_idx] ON [dbo].[AuditLog]([createdAt] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditLog_targetType_idx] ON [dbo].[AuditLog]([targetType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SystemSetting_key_idx] ON [dbo].[SystemSetting]([key]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SystemSetting_isEnabled_idx] ON [dbo].[SystemSetting]([isEnabled]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GuidedSendSession_campaignId_idx] ON [dbo].[GuidedSendSession]([campaignId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GuidedSendSession_createdByUserId_idx] ON [dbo].[GuidedSendSession]([createdByUserId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GuidedSendSession_status_idx] ON [dbo].[GuidedSendSession]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GuidedSendSession_createdAt_idx] ON [dbo].[GuidedSendSession]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GuidedSendSession_clientId_idx] ON [dbo].[GuidedSendSession]([clientId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GuidedSendRecipient_sessionId_status_order_idx] ON [dbo].[GuidedSendRecipient]([sessionId], [status], [order]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GuidedSendRecipient_sessionId_idx] ON [dbo].[GuidedSendRecipient]([sessionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GuidedSendRecipient_candidateId_idx] ON [dbo].[GuidedSendRecipient]([candidateId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GuidedSendRecipient_status_idx] ON [dbo].[GuidedSendRecipient]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GuidedSendRecipient_phoneE164_idx] ON [dbo].[GuidedSendRecipient]([phoneE164]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GuidedSendRecipient_order_idx] ON [dbo].[GuidedSendRecipient]([order]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GuidedSendRecipient_phoneRaw_idx] ON [dbo].[GuidedSendRecipient]([phoneRaw]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_clientId_fkey] FOREIGN KEY ([clientId]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_createdBy_fkey] FOREIGN KEY ([createdBy]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Candidate] ADD CONSTRAINT [Candidate_clientId_fkey] FOREIGN KEY ([clientId]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Candidate] ADD CONSTRAINT [Candidate_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Candidate] ADD CONSTRAINT [Candidate_recruiterId_fkey] FOREIGN KEY ([recruiterId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Campaign] ADD CONSTRAINT [Campaign_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CampaignRecipient] ADD CONSTRAINT [CampaignRecipient_campaignId_fkey] FOREIGN KEY ([campaignId]) REFERENCES [dbo].[Campaign]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CampaignRecipient] ADD CONSTRAINT [CampaignRecipient_candidateId_fkey] FOREIGN KEY ([candidateId]) REFERENCES [dbo].[Candidate]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GuidedSendSession] ADD CONSTRAINT [GuidedSendSession_campaignId_fkey] FOREIGN KEY ([campaignId]) REFERENCES [dbo].[Campaign]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GuidedSendSession] ADD CONSTRAINT [GuidedSendSession_createdByUserId_fkey] FOREIGN KEY ([createdByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[GuidedSendRecipient] ADD CONSTRAINT [GuidedSendRecipient_sessionId_fkey] FOREIGN KEY ([sessionId]) REFERENCES [dbo].[GuidedSendSession]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[GuidedSendRecipient] ADD CONSTRAINT [GuidedSendRecipient_candidateId_fkey] FOREIGN KEY ([candidateId]) REFERENCES [dbo].[Candidate]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

