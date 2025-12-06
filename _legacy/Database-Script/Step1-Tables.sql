SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Create AdminMenuItems table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AdminMenuItems')
BEGIN
    CREATE TABLE [dbo].[AdminMenuItems](
        [MenuItemId] [bigint] IDENTITY(1,1) NOT NULL,
        [ChapterId] [bigint] NULL,
        [DisplayName] [nvarchar](256) NOT NULL,
        [PageLevel] [int] NULL,
        [PageParentId] [bigint] NULL,
        [IdPath] [nvarchar](1024) NULL,
        [Position] [int] NULL,
        [IsTopBar] [bit] NULL,
        [IsMenuBar] [bit] NULL,
        [IsQuickLinks] [bit] NULL,
        [IsFooterBar] [bit] NULL,
        [PageUrl] [nvarchar](256) NULL,
        [OtherUrl] [nvarchar](256) NULL,
        [IsActive] [bit] NOT NULL,
        [UpdatedBy] [nvarchar](64) NULL,
        [UpdatedDate] [datetime] NULL,
        [InsertedBy] [nvarchar](64) NULL,
        [InsertedDate] [datetime] NULL,
        [IsEdit] [bit] NULL,
        [IsView] [bit] NULL,
        [IsDelete] [bit] NULL,
        [IsExport] [bit] NULL,
     CONSTRAINT [PK_AdminMenuItems] PRIMARY KEY CLUSTERED 
    (
        [MenuItemId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Create AppInfo table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AppInfo')
BEGIN
    CREATE TABLE [dbo].[AppInfo](
        [AppInfoId] [int] IDENTITY(1,1) NOT NULL,
        [ChapterId] [bigint] NULL,
        [SiteName] [nvarchar](128) NOT NULL,
        [CompanyAddress] [nvarchar](512) NOT NULL,
        [CompanyWebSite] [nvarchar](256) NOT NULL,
        [CompanyEmail] [nvarchar](60) NOT NULL,
        [CompanyPhone] [nvarchar](64) NULL,
        [PresidentEmail] [nvarchar](128) NULL,
        [PresidentPhone] [nvarchar](25) NULL,
        [SecretaryEmail] [nvarchar](128) NULL,
        [SecretaryPhone] [nvarchar](128) NULL,
        [CustomerCareNumber] [nvarchar](25) NULL,
        [TollFreeNumber] [nvarchar](25) NULL,
        [FacebookUrl] [nvarchar](512) NULL,
        [TwitterUrl] [nvarchar](512) NULL,
        [YoutubeUrl] [nvarchar](512) NULL,
        [SupportEmail] [nvarchar](512) NULL,
        [EnqueryEmail] [nvarchar](512) NULL,
        [PageTitle] [nvarchar](1024) NULL,
        [MetaDescription] [nvarchar](max) NULL,
        [MetaKeywords] [nvarchar](max) NULL,
        [Topline] [nvarchar](2024) NULL,
        [PageItems] [int] NULL,
        [UpdatedBy] [nvarchar](64) NOT NULL,
        [UpdatedTime] [datetime] NOT NULL,
        [BaseUrl] [nvarchar](max) NULL,
        [UploadPath] [nvarchar](max) NULL,
        [UserUploadPath] [nvarchar](max) NULL,
        [UserSiteUrl] [nvarchar](1024) NULL,
        [ServerMapUrl] [nvarchar](max) NULL,
        [AdminImageUrl] [nvarchar](1024) NULL,
        [AdminSiteUrl] [nvarchar](1024) NULL,
        [MailName] [nvarchar](512) NULL,
        [SenderEmail] [nvarchar](1024) NULL,
        [MemberEmail] [nvarchar](1024) NULL,
        [ExhibitEmail] [nvarchar](1024) NULL,
        [EventsEmail] [nvarchar](1024) NULL,
        [ContactEmail] [nvarchar](1024) NULL,
        [DonationEmail] [nvarchar](1024) NULL,
        [VolunteerEmail] [nvarchar](1024) NULL,
        [SponsorshipEmail] [nvarchar](1024) NULL,
        [BrevoKey] [nvarchar](max) NULL,
        [AndroidVersion] [int] NULL,
        [IOSVersion] [int] NULL,
        [DesktopVersion] [int] NULL,
        [AppUpdate] [nvarchar](256) NULL,
        [CapchaSiteKey] [nvarchar](max) NULL,
        [CapchaSecreatKey] [nvarchar](max) NULL,
        [ShowCapcha] [nvarchar](256) NULL,
        [InstagramUrl] [nvarchar](1024) NULL,
        [GooglePlusUrl] [nvarchar](1024) NULL,
        [WhatsappNumber] [nvarchar](256) NULL,
        [GoogleAnalyticsScript] [nvarchar](max) NULL,
        [WhatsappScript] [nvarchar](max) NULL
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO

-- Create ApplyNow table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ApplyNow')
BEGIN
    CREATE TABLE [dbo].[ApplyNow](
        [ApplyNowId] [bigint] IDENTITY(1,1) NOT NULL,
        [FirstName] [nvarchar](128) NULL,
        [LastName] [nvarchar](128) NULL,
        [PhoneNo] [nvarchar](128) NULL,
        [Email] [nvarchar](128) NULL,
        [Address] [nvarchar](1024) NULL,
        [City] [nvarchar](128) NULL,
        [State] [nvarchar](128) NULL,
        [ZipCode] [nvarchar](128) NULL,
        [ProgramInterest] [nvarchar](1024) NULL,
        [ProgramBegin] [nvarchar](1024) NULL,
        [Description] [nvarchar](max) NULL,
        [IsActive] [bit] NOT NULL,
        [IpAddress] [nvarchar](max) NULL,
        [InsertedBy] [nvarchar](1024) NULL,
        [InsertedDate] [datetime] NULL,
        [UpdatedBy] [nvarchar](1024) NULL,
        [UpdatedDate] [datetime] NULL,
     CONSTRAINT [PK_ApplyNow] PRIMARY KEY CLUSTERED 
    (
        [ApplyNowId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO

-- Create Chapters table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Chapters')
BEGIN
    SET ANSI_PADDING ON

    CREATE TABLE [dbo].[Chapters](
        [ChapterId] [bigint] IDENTITY(1,1) NOT NULL,
        [ChapterName] [nvarchar](512) NOT NULL,
        [ShortName] [nvarchar](512) NOT NULL,
        [ShortDescription] [nvarchar](max) NULL,
        [Description] [nvarchar](max) NULL,
        [Address] [nvarchar](2048) NULL,
        [City] [nvarchar](128) NULL,
        [State] [nvarchar](128) NULL,
        [ZipCode] [nvarchar](25) NULL,
        [IsActive] [bit] NOT NULL,
        [OrderNo] [bigint] NULL,
        [UpdatedBy] [nvarchar](64) NOT NULL,
        [UpdatedDate] [datetime] NOT NULL,
        [CoordinatorPhone] [varchar](200) NULL,
        [CoordinatorName] [varchar](1050) NULL,
        [CoordinatorEmail] [varchar](200) NULL,
        [IsNotification] [varchar](200) NULL,
     CONSTRAINT [PK_Chapters] PRIMARY KEY CLUSTERED 
    (
        [ChapterId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

    SET ANSI_PADDING OFF
END
GO

-- Create ChapterUsers table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChapterUsers')
BEGIN
    CREATE TABLE [dbo].[ChapterUsers](
        [ChapterUserId] [bigint] IDENTITY(1,1) NOT NULL,
        [ChapterId] [bigint] NULL,
        [UserId] [bigint] NULL,
     CONSTRAINT [PK_ChapterUsers] PRIMARY KEY CLUSTERED 
    (
        [ChapterUserId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Create EmployeeOpportunities table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EmployeeOpportunities')
BEGIN
    CREATE TABLE [dbo].[EmployeeOpportunities](
        [EmployeeOpportunitiesId] [bigint] IDENTITY(1,1) NOT NULL,
        [FirstName] [nvarchar](128) NULL,
        [LastName] [nvarchar](128) NULL,
        [PhoneNo] [nvarchar](128) NULL,
        [Email] [nvarchar](128) NULL,
        [CurrentJob] [nvarchar](1024) NULL,
        [Currentlive] [nvarchar](1024) NULL,
        [LinkedInUrl] [nvarchar](1024) NULL,
        [Description] [nvarchar](1024) NULL,
        [IsActive] [bit] NOT NULL,
        [IpAddress] [nvarchar](max) NULL,
        [InsertedBy] [nvarchar](1024) NULL,
        [InsertedDate] [datetime] NULL,
        [UpdatedBy] [nvarchar](1024) NULL,
        [UpdatedDate] [datetime] NULL,
     CONSTRAINT [PK_EmployeeOpportunities] PRIMARY KEY CLUSTERED 
    (
        [EmployeeOpportunitiesId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO

-- Create Enquiries table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Enquiries')
BEGIN
    CREATE TABLE [dbo].[Enquiries](
        [EnquiryId] [bigint] IDENTITY(1,1) NOT NULL,
        [EventId] [bigint] NULL,
        [Name] [nvarchar](128) NOT NULL,
        [Email] [nvarchar](128) NOT NULL,
        [Description] [nvarchar](1024) NOT NULL,
        [Subject] [nvarchar](128) NULL,
        [PhoneNo] [nvarchar](50) NULL,
        [IsActive] [bit] NOT NULL,
        [InsertedTime] [datetime] NOT NULL,
        [Field1] [nvarchar](512) NULL,
        [Field2] [nvarchar](512) NULL,
     CONSTRAINT [PK_Enquiries] PRIMARY KEY CLUSTERED 
    (
        [EnquiryId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Create InnerPageCategories table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InnerPageCategories')
BEGIN
    CREATE TABLE [dbo].[InnerPageCategories](
        [InnerPageCategoryId] [bigint] IDENTITY(1,1) NOT NULL,
        [ChapterId] [bigint] NULL,
        [DisplayName] [nvarchar](256) NOT NULL,
        [PageLevel] [int] NULL,
        [PageParentId] [bigint] NULL,
        [IdPath] [nvarchar](1024) NULL,
        [Position] [int] NULL,
        [IsTopBar] [bit] NULL,
        [IsMenuBar] [bit] NULL,
        [IsQuickLinks] [bit] NULL,
        [IsFooterBar] [bit] NULL,
        [IsActive] [bit] NOT NULL,
        [UpdatedBy] [nvarchar](64) NULL,
        [UpdatedDate] [datetime] NULL,
        [InsertedBy] [nvarchar](64) NULL,
        [InsertedDate] [datetime] NULL,
     CONSTRAINT [PK_InnerPageCategories] PRIMARY KEY CLUSTERED 
    (
        [InnerPageCategoryId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Create InnerPages table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InnerPages')
BEGIN
    CREATE TABLE [dbo].[InnerPages](
        [InnerPageId] [bigint] IDENTITY(1,1) NOT NULL,
        [InnerPageCategoryId] [bigint] NULL,
        [Heading] [nvarchar](512) NOT NULL,
        [Description] [nvarchar](max) NOT NULL,
        [DisplayOrder] [int] NULL,
        [IsActive] [bit] NOT NULL,
        [PageTitle] [nvarchar](512) NULL,
        [MetaDescription] [nvarchar](1024) NULL,
        [MetaKeywords] [nvarchar](1024) NULL,
        [Topline] [nvarchar](2024) NULL,
        [InsertedBy] [nvarchar](64) NOT NULL,
        [InsertedTime] [datetime] NOT NULL,
        [UpdatedBy] [nvarchar](64) NOT NULL,
        [UpdatedTime] [datetime] NOT NULL,
     CONSTRAINT [PK_InnerPages] PRIMARY KEY CLUSTERED 
    (
        [InnerPageId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO

-- Create LogReport table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LogReport')
BEGIN
    CREATE TABLE [dbo].[LogReport](
        [LogId] [bigint] IDENTITY(1,1) NOT NULL,
        [LogTitle] [nvarchar](256) NULL,
        [LogDescription] [nvarchar](max) NULL,
        [LogDate] [datetime] NULL,
        [InsertedBy] [nvarchar](64) NULL,
        [InsertedDate] [datetime] NULL,
        [UpdatedBy] [nvarchar](64) NULL,
        [UpdatedDate] [datetime] NULL,
     CONSTRAINT [PK_LogReport] PRIMARY KEY CLUSTERED 
    (
        [LogId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO

-- Create MailTemplates table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MailTemplates')
BEGIN
    CREATE TABLE [dbo].[MailTemplates](
        [MailTemplateId] [bigint] IDENTITY(1,1) NOT NULL,
        [Heading] [nvarchar](512) NOT NULL,
        [Subject] [nvarchar](512) NOT NULL,
        [Description] [nvarchar](max) NOT NULL,
        [MailType] [nvarchar](50) NULL,
        [UpdatedBy] [nvarchar](64) NOT NULL,
        [UpdatedTime] [datetime] NOT NULL,
     CONSTRAINT [PK_MailTemplates] PRIMARY KEY CLUSTERED 
    (
        [MailTemplateId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO

-- Create Members table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Members')
BEGIN
    CREATE TABLE [dbo].[Members](
        [MemberId] [bigint] IDENTITY(1,1) NOT NULL,
        [ChapterId] [bigint] NULL,
        [Title] [nvarchar](64) NULL,
        [Email] [nvarchar](128) NULL,
        [Password] [nvarchar](256) NULL,
        [FirstName] [nvarchar](150) NULL,
        [LastName] [nvarchar](150) NULL,
        [ProfileImage] [nvarchar](512) NULL,
        [Occupation] [nvarchar](256) NULL,
        [MemberAge] [nvarchar](256) NULL,
        [MemberSkils] [nvarchar](256) NULL,
        [SpouseFirstName] [nvarchar](150) NULL,
        [SpouseLastName] [nvarchar](150) NULL,
        [SpouseOccupation] [nvarchar](256) NULL,
        [SpouseEmail] [nvarchar](128) NULL,
        [SpouseCell] [nvarchar](64) NULL,
        [SpouseSkils] [nvarchar](256) NULL,
        [Address] [nvarchar](512) NULL,
        [City] [nvarchar](128) NULL,
        [State] [nvarchar](128) NULL,
        [ZipCode] [nvarchar](64) NULL,
        [HomePhone] [nvarchar](64) NULL,
        [MobilePhone] [nvarchar](64) NULL,
        [IsApproved] [bit] NOT NULL,
        [IsLockedOut] [bit] NULL,
        [IsActivated] [bit] NULL,
        [DateActivated] [datetime] NULL,
        [RegistrationGUID] [uniqueidentifier] NULL,
        [FailedPasswordAttemptCount] [int] NULL,
        [LastPasswordChangedDate] [datetime] NULL,
        [LastActivityDate] [datetime] NULL,
        [MembershipTypeId] [bigint] NULL,
        [IsVolunteer] [bit] NULL,
        [IsTeluguorigin] [bit] NULL,
        [Comments] [nvarchar](2048) NULL,
        [ReferredBy] [nvarchar](1024) NULL,
        [InsertedTime] [datetime] NOT NULL,
        [UpdatedTime] [datetime] NOT NULL,
        [Fax] [nvarchar](64) NULL,
        [WebsiteAddress] [nvarchar](64) NULL,
        [Address2] [nvarchar](512) NULL,
        [Zelle] [nvarchar](512) NULL,
        [ReceiptUrl] [nvarchar](max) NULL,
        [ZellePartnerName] [nvarchar](512) NULL,
        [ChequeHolderName] [nvarchar](512) NULL,
     CONSTRAINT [PK_Users1] PRIMARY KEY CLUSTERED 
    (
        [MemberId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO

-- Create MenuItems table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MenuItems')
BEGIN
    CREATE TABLE [dbo].[MenuItems](
        [MenuItemId] [bigint] IDENTITY(1,1) NOT NULL,
        [ChapterId] [bigint] NULL,
        [DisplayName] [nvarchar](256) NOT NULL,
        [PageLevel] [int] NULL,
        [PageParentId] [bigint] NULL,
        [IdPath] [nvarchar](1024) NULL,
        [Position] [int] NULL,
        [IsTopBar] [bit] NULL,
        [IsMenuBar] [bit] NULL,
        [IsQuickLinks] [bit] NULL,
        [IsFooterBar] [bit] NULL,
        [IsActive] [bit] NOT NULL,
        [UpdatedBy] [nvarchar](64) NULL,
        [UpdatedDate] [datetime] NULL,
        [InsertedBy] [nvarchar](64) NULL,
        [InsertedDate] [datetime] NULL,
     CONSTRAINT [PK_Categories] PRIMARY KEY CLUSTERED 
    (
        [MenuItemId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Create MenuPages table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MenuPages')
BEGIN
    CREATE TABLE [dbo].[MenuPages](
        [MenuPageId] [bigint] IDENTITY(1,1) NOT NULL,
        [MenuItemId] [bigint] NOT NULL,
        [PageDetailId] [bigint] NOT NULL,
     CONSTRAINT [PK_MenuPages] PRIMARY KEY CLUSTERED 
    (
        [MenuPageId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Create PageDetails table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PageDetails')
BEGIN
    CREATE TABLE [dbo].[PageDetails](
        [PageDetailId] [bigint] IDENTITY(1,1) NOT NULL,
        [Heading] [nvarchar](256) NULL,
        [Description] [nvarchar](max) NULL,
        [PageUrl] [nvarchar](512) NULL,
        [DocumentUrl] [nvarchar](512) NULL,
        [Target] [nvarchar](256) NULL,
        [PageTitle] [nvarchar](512) NULL,
        [MetaDescription] [nvarchar](1024) NULL,
        [MetaKeywords] [nvarchar](1024) NULL,
        [TopLine] [nvarchar](2024) NULL,
        [IsActive] [bit] NOT NULL,
        [UpdatedBy] [nvarchar](64) NULL,
        [UpdatedDate] [datetime] NULL,
        [InsertedBy] [nvarchar](64) NULL,
        [InsertedDate] [datetime] NULL,
        [OtherUrl] [nvarchar](512) NULL,
        [AddPage] [nvarchar](256) NULL,
     CONSTRAINT [PK_PageDetails] PRIMARY KEY CLUSTERED 
    (
        [PageDetailId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO

-- Create PaymentMethods table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PaymentMethods')
BEGIN
    CREATE TABLE [dbo].[PaymentMethods](
        [PaymentMethodId] [bigint] IDENTITY(1,1) NOT NULL,
        [PaymentMethod] [nvarchar](156) NOT NULL,
        [IsActive] [bit] NOT NULL,
     CONSTRAINT [PK_PaymentMethods] PRIMARY KEY CLUSTERED 
    (
        [PaymentMethodId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Create PaymentSettings table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PaymentSettings')
BEGIN
    CREATE TABLE [dbo].[PaymentSettings](
        [PaymentSettingId] [bigint] IDENTITY(1,1) NOT NULL,
        [PaymentMethodId] [bigint] NULL,
        [PaymentUrl] [nvarchar](512) NOT NULL,
        [PaymentEmail] [nvarchar](128) NOT NULL,
        [PaymentPassword] [nvarchar](256) NOT NULL,
        [CurrencyCodeId] [bigint] NOT NULL,
        [SuccessUrl] [nvarchar](256) NOT NULL,
        [CancelUrl] [nvarchar](256) NOT NULL,
        [NotifyURL] [nvarchar](256) NULL,
        [TokenNo] [nvarchar](128) NULL,
        [AccountType] [nvarchar](30) NULL,
        [IsActive] [bit] NULL,
     CONSTRAINT [PK_PaymentSettings] PRIMARY KEY CLUSTERED 
    (
        [PaymentSettingId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Create PaymentStatus table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PaymentStatus')
BEGIN
    CREATE TABLE [dbo].[PaymentStatus](
        [PaymentStatusId] [bigint] IDENTITY(1,1) NOT NULL,
        [PaymentStatus] [nvarchar](156) NOT NULL,
        [IsActive] [bit] NOT NULL,
     CONSTRAINT [PK_PaymentStatus] PRIMARY KEY CLUSTERED 
    (
        [PaymentStatusId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Create Redirections table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Redirections')
BEGIN
    CREATE TABLE [dbo].[Redirections](
        [RedirectionId] [bigint] IDENTITY(1,1) NOT NULL,
        [FromUrl] [nvarchar](max) NULL,
        [ToUrl] [nvarchar](max) NULL,
        [Target] [nvarchar](512) NULL,
        [IsActive] [bit] NULL,
        [Field1] [nvarchar](512) NULL,
        [Field2] [nvarchar](512) NULL,
        [InsertedBy] [nvarchar](512) NOT NULL,
        [InsertedDate] [datetime] NOT NULL,
        [UpdatedBy] [nvarchar](512) NOT NULL,
        [UpdatedDate] [datetime] NOT NULL,
     CONSTRAINT [PK_Redirections] PRIMARY KEY CLUSTERED 
    (
        [RedirectionId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO

-- Create RequestTranscript table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RequestTranscript')
BEGIN
    CREATE TABLE [dbo].[RequestTranscript](
        [RequestTranscriptId] [bigint] IDENTITY(1,1) NOT NULL,
        [FullName] [nvarchar](128) NULL,
        [FormerName] [nvarchar](128) NULL,
        [PhoneNo] [nvarchar](128) NULL,
        [Email] [nvarchar](128) NULL,
        [SSN] [nvarchar](128) NULL,
        [DOB] [datetime] NULL,
        [ProgramAttended] [nvarchar](1024) NULL,
        [PreviousAttended] [nvarchar](1024) NULL,
        [Address] [nvarchar](1024) NULL,
        [City] [nvarchar](128) NULL,
        [State] [nvarchar](128) NULL,
        [ZipCode] [nvarchar](128) NULL,
        [TranscriptRequest] [nvarchar](1024) NULL,
        [DocumentSent] [nvarchar](1024) NULL,
        [Description] [nvarchar](max) NULL,
        [Signature] [nvarchar](128) NULL,
        [CheckBox1] [bit] NULL,
        [CheckBox2] [bit] NULL,
        [IsActive] [bit] NOT NULL,
        [IpAddress] [nvarchar](max) NULL,
        [InsertedBy] [nvarchar](1024) NULL,
        [InsertedDate] [datetime] NULL,
        [UpdatedBy] [nvarchar](1024) NULL,
        [UpdatedDate] [datetime] NULL,
     CONSTRAINT [PK_RequestTranscript] PRIMARY KEY CLUSTERED 
    (
        [RequestTranscriptId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO

-- Create Role_Menu table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Role_Menu')
BEGIN
    SET ANSI_PADDING ON
    
    CREATE TABLE [dbo].[Role_Menu](
        [RoleId] [int] NULL,
        [MenuId] [int] NULL,
        [MenuName] [varchar](50) NULL,
        [CreatedDate] [datetime] NULL,
        [ModifiedDate] [datetime] NULL,
        [CreatedBy] [varchar](50) NULL,
        [ModifiedBy] [varchar](50) NULL,
        [EmployeeCompanyId] [int] NULL
    ) ON [PRIMARY]
    
    SET ANSI_PADDING OFF
END
GO

-- Create RoleMenu table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RoleMenu')
BEGIN
    CREATE TABLE [dbo].[RoleMenu](
        [MenuRolesId] [bigint] IDENTITY(1,1) NOT NULL,
        [UserId] [bigint] NULL,
        [RoleId] [bigint] NULL,
        [MenuItemId] [bigint] NULL,
        [CreatedDate] [datetime] NULL,
        [CreatedBy] [nvarchar](256) NULL,
     CONSTRAINT [PK_RoleMenu] PRIMARY KEY CLUSTERED 
    (
        [MenuRolesId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Create Roles table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    CREATE TABLE [dbo].[Roles](
        [RoleId] [bigint] IDENTITY(1,1) NOT NULL,
        [RoleName] [nvarchar](50) NOT NULL,
        [IsActive] [bit] NOT NULL,
        [UpdatedTime] [datetime] NOT NULL,
        [UpdatedBy] [nvarchar](64) NOT NULL,
        [ParentId] [bigint] NULL,
     CONSTRAINT [PK_Roles] PRIMARY KEY CLUSTERED 
    (
        [RoleId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Create UserRoles table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
BEGIN
    CREATE TABLE [dbo].[UserRoles](
        [UserRoleId] [bigint] IDENTITY(1,1) NOT NULL,
        [UserId] [bigint] NULL,
        [RoleId] [bigint] NOT NULL,
        [MemberId] [bigint] NULL,
        [IsAdd] [bit] NULL,
        [IsEdit] [bit] NULL,
        [IsView] [bit] NULL,
        [IsDelete] [bit] NULL,
        [IsExport] [bit] NULL,
     CONSTRAINT [PK_UserRoles] PRIMARY KEY CLUSTERED 
    (
        [UserRoleId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Create Users table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE [dbo].[Users](
        [UserId] [bigint] IDENTITY(1,1) NOT NULL,
        [ChapterId] [bigint] NULL,
        [UserName] [nvarchar](64) NOT NULL,
        [Email] [nvarchar](128) NOT NULL,
        [Password] [nvarchar](256) NULL,
        [ProfileImage] [nvarchar](256) NULL,
        [Designation] [nvarchar](1024) NULL,
        [MobilePhone] [nvarchar](64) NULL,
        [IsApproved] [bit] NOT NULL,
        [IsLockedOut] [bit] NOT NULL,
        [IsActivated] [bit] NULL,
        [DateActivated] [datetime] NULL,
        [RegistrationGUID] [uniqueidentifier] NULL,
        [FailedPasswordAttemptCount] [int] NULL,
        [LastPasswordChangedDate] [datetime] NULL,
        [LastLoginDate] [datetime] NULL,
        [InsertedTime] [datetime] NOT NULL,
        [InsertedBy] [nvarchar](64) NOT NULL,
        [UpdatedTime] [datetime] NOT NULL,
        [UpdatedBy] [nvarchar](64) NOT NULL,
        [RoleName] [nvarchar](126) NULL,
     CONSTRAINT [PK_Users_1] PRIMARY KEY CLUSTERED 
    (
        [UserId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Create VideoCategories table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VideoCategories')
BEGIN
    CREATE TABLE [dbo].[VideoCategories](
        [VideoCategoryId] [bigint] IDENTITY(1,1) NOT NULL,
        [ChapterId] [bigint] NULL,
        [CategoryName] [nvarchar](512) NULL,
        [Year] [bigint] NULL,
        [UpdatedBy] [nvarchar](64) NOT NULL,
        [UpdatedTime] [datetime] NOT NULL,
     CONSTRAINT [PK_VideoCategories] PRIMARY KEY CLUSTERED 
    (
        [VideoCategoryId] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
END
GO

-- Add default constraints and relationships only if tables exist and constraints don't exist

-- Add default constraint for Roles.UpdatedTime if not exists
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles') 
    AND NOT EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF_Roles_UpdatedTime')
BEGIN
    ALTER TABLE [dbo].[Roles] ADD CONSTRAINT [DF_Roles_UpdatedTime] DEFAULT (getdate()) FOR [UpdatedTime]
END
GO

-- Add default constraint for Users.UpdatedTime if not exists
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users') 
    AND NOT EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF_Users_UpdatedTime')
BEGIN
    ALTER TABLE [dbo].[Users] ADD CONSTRAINT [DF_Users_UpdatedTime] DEFAULT (getdate()) FOR [UpdatedTime]
END
GO

-- Add foreign key constraints if tables exist and constraints don't exist

-- UserRoles.RoleId -> Roles.RoleId
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
    AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
    AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_UserRoles_Roles')
BEGIN
    ALTER TABLE [dbo].[UserRoles] WITH CHECK ADD CONSTRAINT [FK_UserRoles_Roles] FOREIGN KEY([RoleId])
    REFERENCES [dbo].[Roles] ([RoleId])
    ON DELETE CASCADE
END
GO

-- Ensure the constraint is checked if it exists
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_UserRoles_Roles')
BEGIN
    ALTER TABLE [dbo].[UserRoles] CHECK CONSTRAINT [FK_UserRoles_Roles]
END
GO

-- UserRoles.UserId -> Users.UserId
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
    AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
    AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_UserRoles_Users')
BEGIN
    ALTER TABLE [dbo].[UserRoles] WITH CHECK ADD CONSTRAINT [FK_UserRoles_Users] FOREIGN KEY([UserId])
    REFERENCES [dbo].[Users] ([UserId])
    ON DELETE CASCADE
END
GO

-- Ensure the constraint is checked if it exists
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_UserRoles_Users')
BEGIN
    ALTER TABLE [dbo].[UserRoles] CHECK CONSTRAINT [FK_UserRoles_Users]
END
GO

-- Users.ChapterId -> Chapters.ChapterId
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
    AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Chapters')
    AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Users_Chapters')
BEGIN
    ALTER TABLE [dbo].[Users] WITH CHECK ADD CONSTRAINT [FK_Users_Chapters] FOREIGN KEY([ChapterId])
    REFERENCES [dbo].[Chapters] ([ChapterId])
END
GO

-- Ensure the constraint is checked if it exists
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Users_Chapters')
BEGIN
    ALTER TABLE [dbo].[Users] CHECK CONSTRAINT [FK_Users_Chapters]
END
GO

-- VideoCategories.ChapterId -> Chapters.ChapterId
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'VideoCategories')
    AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Chapters')
    AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_VideoCategories_Chapters')
BEGIN
    ALTER TABLE [dbo].[VideoCategories] WITH CHECK ADD CONSTRAINT [FK_VideoCategories_Chapters] FOREIGN KEY([ChapterId])
    REFERENCES [dbo].[Chapters] ([ChapterId])
END
GO

-- Ensure the constraint is checked if it exists
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_VideoCategories_Chapters')
BEGIN
    ALTER TABLE [dbo].[VideoCategories] CHECK CONSTRAINT [FK_VideoCategories_Chapters]
END
GO
