BEGIN TRY

BEGIN TRAN;

-- AlterTable Campaign: Add split message mode fields
ALTER TABLE [dbo].[Campaign] ADD [splitMessageMode] BIT NOT NULL CONSTRAINT [Campaign_splitMessageMode_df] DEFAULT 0;
ALTER TABLE [dbo].[Campaign] ADD [message1Template] TEXT;
ALTER TABLE [dbo].[Campaign] ADD [message2Template] TEXT;
ALTER TABLE [dbo].[Campaign] ADD [message3Template] TEXT;

-- AlterTable CampaignRecipient: Add currentMessagePart field
ALTER TABLE [dbo].[CampaignRecipient] ADD [currentMessagePart] INT;

-- AlterTable GuidedSendRecipient: Add currentMessagePart field
ALTER TABLE [dbo].[GuidedSendRecipient] ADD [currentMessagePart] INT;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

