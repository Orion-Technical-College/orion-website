BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[RateLimit] (
    [id] NVARCHAR(1000) NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [count] INT NOT NULL CONSTRAINT [RateLimit_count_df] DEFAULT 1,
    [resetAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [RateLimit_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [RateLimit_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RateLimit_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RateLimit_resetAt_idx] ON [dbo].[RateLimit]([resetAt]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW;

END CATCH
