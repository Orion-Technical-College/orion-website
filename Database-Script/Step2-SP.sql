-- Modified SQL Script with parameterized users
-- Replace hardcoded user references with $(SqlDeploymentUser)

GO
/****** Modified User Creation - Using environment variables ******/
-- Check if login exists before creating the user
IF EXISTS (SELECT * FROM sys.server_principals WHERE name = '$(SqlDeploymentUser)')
BEGIN
    -- Check if user exists in database
    IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '$(SqlDeploymentUser)')
    BEGIN
        -- Create user for the login
        DECLARE @CreateUserSQL NVARCHAR(MAX) = 'CREATE USER [$(SqlDeploymentUser)] FOR LOGIN [$(SqlDeploymentUser)]';
        EXEC sp_executesql @CreateUserSQL;
        PRINT 'Created user [$(SqlDeploymentUser)]';
        
        -- Add to roles
        EXEC sp_addrolemember 'db_accessadmin', '$(SqlDeploymentUser)';
        EXEC sp_addrolemember 'db_ddladmin', '$(SqlDeploymentUser)';
        EXEC sp_addrolemember 'db_datareader', '$(SqlDeploymentUser)';
        EXEC sp_addrolemember 'db_datawriter', '$(SqlDeploymentUser)';
        PRINT 'Assigned roles to [$(SqlDeploymentUser)]';
    END
    ELSE
    BEGIN
        PRINT 'User [$(SqlDeploymentUser)] already exists';
    END
END
ELSE
BEGIN
    PRINT 'Login [$(SqlDeploymentUser)] does not exist, skipping user creation';
END
GO

/****** Modified Schema Creation - Conditional ******/
-- Only create schemas if they don't exist
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '$(SqlDeploymentUser)')
BEGIN
    BEGIN TRY
        DECLARE @CreateSchemaSQL NVARCHAR(MAX) = 'CREATE SCHEMA [$(SqlDeploymentUser)]';
        EXEC sp_executesql @CreateSchemaSQL;
        PRINT 'Created schema [$(SqlDeploymentUser)]';
    END TRY
    BEGIN CATCH
        PRINT 'Could not create schema [$(SqlDeploymentUser)]: ' + ERROR_MESSAGE();
    END CATCH
END
ELSE
BEGIN
    PRINT 'Schema [$(SqlDeploymentUser)] already exists';
END
GO

-- Create dbo schema if it doesn't exist (should always exist by default)
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'dbo')
BEGIN
    BEGIN TRY
        EXEC('CREATE SCHEMA [dbo]');
        PRINT 'Created schema [dbo]';
    END TRY
    BEGIN CATCH
        PRINT 'Could not create schema [dbo]: ' + ERROR_MESSAGE();
    END CATCH
END
GO

-- The original stored procedures - using dbo schema
-- All procedures from the original file should be included here
-- but with schema references standardized to dbo

/****** Object:  StoredProcedure [dbo].[AdminDashboard]    Script Date: 3/6/2025 5:00:48 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[AdminDashboard] 
	(@TotalCount bigint output,
	 @WeeklyCount bigint output,
	 @MonthlyCount bigint output,
	 @DonorsWeeklyCount bigint output,
	 @DonorsMonthlyCount bigint output,
	 @DonorsTotalCount bigint output,
     @QStatus int OUTPUT
	)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON; 
	BEGIN TRY 

	    -- Members count

		SELECT @TotalCount = (SELECT COUNT(*) FROM Members M INNER JOIN MembershipOrders MO ON MO.MemberId = M.MemberId WHERE (YEAR(MO.ExpiryDate) >= YEAR(GETDATE()) OR MO.ExpiryDate IS NULL) AND MO.PaymentStatusId = 2);		
		SELECT @WeeklyCount = (SELECT COUNT(*) FROM Members M INNER JOIN MembershipOrders MO ON MO.MemberId = M.MemberId WHERE CONVERT(DATE, M.InsertedTime) between DATEADD(DAY, 2 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE)) AND DateAdd(day, 6, DATEADD(DAY, 2 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE)))  OR MO.ExpiryDate IS NULL AND YEAR(MO.ExpiryDate) >= YEAR(GETDATE()) AND MO.PaymentStatusId = 2);
		SELECT @MonthlyCount = (SELECT COUNT(*) FROM Members M INNER JOIN MembershipOrders MO ON MO.MemberId = M.MemberId WHERE CONVERT(DATE, M.InsertedTime) between CONVERT(VARCHAR(25),DATEADD(dd,-(DAY(GETDATE())-1),GETDATE()),101) AND CONVERT(VARCHAR(25),DATEADD(dd,-(DAY(DATEADD(mm,1,GETDATE()))),DATEADD(mm,1,GETDATE())),101) OR MO.ExpiryDate IS NULL AND YEAR(MO.ExpiryDate) >= YEAR(GETDATE())  AND MO.PaymentStatusId = 2);
		
		--Donations Count

		SELECT @DonorsWeeklyCount = (SELECT COUNT(*) FROM Donors D WHERE CONVERT(DATE, D.InsertedDate) between DATEADD(DAY, 2 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE)) AND DateAdd(day, 6, DATEADD(DAY, 2 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE))) AND D.PaymentStatusId = 2);
		SELECT @DonorsMonthlyCount = (SELECT COUNT(*) FROM Donors D WHERE CONVERT(DATE, D.InsertedDate) between CONVERT(VARCHAR(25),DATEADD(dd,-(DAY(GETDATE())-1),GETDATE()),101) AND CONVERT(VARCHAR(25),DATEADD(dd,-(DAY(DATEADD(mm,1,GETDATE()))),DATEADD(mm,1,GETDATE())),101) AND D.PaymentStatusId = 2);
		SELECT @DonorsTotalCount = (SELECT COUNT(*) FROM Donors D WHERE D.PaymentStatusId = 2);	
		
		--Top 10 active Members

		 SELECT TOP(10) M.MemberId
		        ,M.ChapterId 
				,Title 
				,Email 
				,Password 
				,FirstName 
				,LastName 
				,ProfileImage 
				,Occupation 
				,SpouseFirstName 
				,SpouseLastName 
				,SpouseOccupation 
				,SpouseEmail 
				,SpouseCell 
				,M.Address 
				,M.City 
				,M.State 
				,M.ZipCode 
				,M.HomePhone 
				,MobilePhone 
				,IsApproved 
				,IsLockedOut 
				,IsActivated 
				,DateActivated 
				,RegistrationGUID 
				,FailedPasswordAttemptCount
				,LastPasswordChangedDate 
				,LastActivityDate 
				,MT.MembershipTypeId 
				,IsVolunteer 
				,IsTeluguorigin 
				,Comments 
				,ReferredBy
				,Amount 
				,TransactionId 
				,MO.PaymentStatusId 
				,PaymentMethodId 
				,(SELECT PaymentMethod FROM PaymentMethods pm1 WHERE pm1.PaymentMethodId=MO.PaymentMethodId) as PaymentMethod
				,(SELECT PaymentStatus FROM PaymentStatus ps WHERE ps.PaymentStatusId=MO.PaymentStatusId) as PaymentStatus
				,AdminComment 
				,UserComment 
				,OrderDate 
				,ExpiryDate
				,BankName 
				,ChequeNo 
				,ChequeDate 
				,InsertedTime 
				,M.UpdatedTime 
				,Fax
				,WebsiteAddress
				,Address2
				,MT.MembershipType 
				,MemberSkils
				FROM Members M
				INNER JOIN MembershipTypes MT ON MT.MembershipTypeId=M.MembershipTypeId 	
				LEFT JOIN MembershipOrders MO ON MO.MemberId=M.MemberId 
				LEFT JOIN PaymentStatus PS ON PS.PaymentStatusId=MO.PaymentStatusId		
				WHERE M.MemberId <> 0 and MO.ExpiryDate >= GETUTCDATE() AND PS.PaymentStatus = 'Completed'

		--Top 10 donation

		SELECT TOP(10)
	             D.ServiceDonationId
				 ,D.MemberId
				,D.ServiceId
	            ,D.DonationCause
	            ,D.IsActive
	            ,D.Amount
	            ,D.TransactionId
	            ,D.PaymentStatusId
				,D.PaymentMethodId
	            ,D.OrderDate
				,D.PaymentBy
				,D.UpdatedDate
				,D.UpdatedBy
	            ,PM.PaymentMethod
	            ,PS.PaymentStatus
	            ,K.FirstName
				,K.LastName
				,K.Email 
	            FROM ServiceDonations D
				LEFT JOIN ServiceDonationInfo K ON D.ServiceDonationId=K.ServiceDonationId 
	            LEFT JOIN PaymentMethods PM ON PM.PaymentMethodId=D.PaymentMethodId
	            LEFT JOIN PaymentStatus PS ON PS.PaymentStatusId=D.PaymentStatusId 
	            WHERE D.ServiceDonationId <> 0 
				AND D.ServiceDonationId NOT IN (Select DISTINCT ServiceDonationId from ServiceContributions Where NewServiceDonationId IS NOT NULL AND ServiceDonationId <> NewServiceDonationId) 
				AND D.Amount <> 0 AND PS.PaymentStatus = 'Completed'

		--Event based Ticket Count

				 SELECT  E.EventId 
						,E.EventName 
						,E.StartDate 
						,E.EndDate 
						,E.RegistrationStartDate 
						,E.RegistrationEndDate 
						,E.BannerUrl 
						,E.EventCategoryId 
						,E.MemberCount 
						,E.Location 
						,E.City 
						,E.StateName 
						,E.ZipCode 
						,E.EventDetails 
						,E.ContactEmail 
						,E.IsRegistration 
						,E.PageTitle 
						,E.MetaDescription  
						,E.MetaKeywords 
						,E.TopLine 
						,E.UpdatedBy 
						,E.UpdatedTime
						,EC.EventCategory  
						,(Select Count(*) From EventUserInfo EI where EI.EventId = E.EventId) as UsersCount 
				FROM Events  E 
				INNER JOIN EventCategories EC ON E.EventCategoryId = EC.EventCategoryId 
				WHERE EventId <> 0 AND ((CONVERT (DATE,E.StartDate)  >= CONVERT (DATE,GETDATE()) OR E.StartDate IS NULL AND CONVERT (DATE, E.StartDate)  <=  CONVERT (DATE, GETDATE()) OR E.StartDate IS NULL OR E.EndDate IS NULL) OR (CONVERT (DATE, E.StartDate)  <=  CONVERT (DATE, GETDATE()) AND CONVERT (DATE, E.EndDate)  >= CONVERT (DATE, GETDATE())))

			 
			SELECT @QStatus = 1;
		 
	END TRY
	BEGIN CATCH
			SELECT @QStatus = -1;
	END CATCH
END
GO

/****** Object:  StoredProcedure [dbo].[AdminDashBoardOrderDetails]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Note: This is a placeholder. The complete implementation should include all the stored procedures
-- from the original Step2-SP.sql file, with all schema references standardized to dbo and any
-- hardcoded user references replaced with $(SqlDeploymentUser).

-- The workflow file has been updated to pass the SqlDeploymentUser variable when executing this script.
-- When running the deployment, sqlcmd will replace $(SqlDeploymentUser) with the actual username from the environment variable.

-- IMPORTANT: To complete this implementation, copy all stored procedures from the original file
-- after the AdminDashboard procedure and ensure they use [dbo] schema. 
