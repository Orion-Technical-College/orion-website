
GO
/****** Object:  User [nareshki_demo3db]    Script Date: 3/6/2025 5:00:43 PM ******/
CREATE USER [nareshki_demo3db] FOR LOGIN [nareshki_demo3db] WITH DEFAULT_SCHEMA=[nareshki_demo3db]
GO
/****** Object:  User [nareshki_maindbuser]    Script Date: 3/6/2025 5:00:44 PM ******/
CREATE USER [nareshki_maindbuser] FOR LOGIN [nareshki_maindbuser] WITH DEFAULT_SCHEMA=[nareshki_maindbuser]
GO
ALTER ROLE [db_accessadmin] ADD MEMBER [nareshki_demo3db]
GO
ALTER ROLE [db_ddladmin] ADD MEMBER [nareshki_demo3db]
GO
ALTER ROLE [db_datareader] ADD MEMBER [nareshki_demo3db]
GO
ALTER ROLE [db_datawriter] ADD MEMBER [nareshki_demo3db]
GO
ALTER ROLE [db_ddladmin] ADD MEMBER [nareshki_maindbuser]
GO
ALTER ROLE [db_datareader] ADD MEMBER [nareshki_maindbuser]
GO
ALTER ROLE [db_datawriter] ADD MEMBER [nareshki_maindbuser]
GO
/****** Object:  Schema [awsdbuser]    Script Date: 3/6/2025 5:00:45 PM ******/
CREATE SCHEMA [awsdbuser]
GO
/****** Object:  Schema [demo3db]    Script Date: 3/6/2025 5:00:46 PM ******/
CREATE SCHEMA [demo3db]
GO
/****** Object:  Schema [malligedb]    Script Date: 3/6/2025 5:00:46 PM ******/
CREATE SCHEMA [malligedb]
GO
/****** Object:  Schema [nareshki_demo2db]    Script Date: 3/6/2025 5:00:47 PM ******/
CREATE SCHEMA [nareshki_demo2db]
GO
/****** Object:  Schema [nareshki_demo3db]    Script Date: 3/6/2025 5:00:48 PM ******/
CREATE SCHEMA [nareshki_demo3db]
GO
/****** Object:  Schema [nareshki_maindbuser]    Script Date: 3/6/2025 5:00:48 PM ******/
CREATE SCHEMA [nareshki_maindbuser]
GO
/****** Object:  StoredProcedure [dbo].[AdminDashboard]    Script Date: 3/6/2025 5:00:48 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[AdminDashboard] 
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


CREATE PROCEDURE [dbo].[AdminDashBoardOrderDetails]
     (@Items int
     ,@Qstatus int OUTPUT
	 ,@MembersActiveCount bigint OUTPUT
	 ,@MembersActiveSumAmount decimal(15,2) OUTPUT
	 ,@MembersInActiveCount bigint OUTPUT
	 ,@MembersInActiveSumAmount decimal(15,2) OUTPUT
	 ,@DonationsWeeklyAmount decimal(15,2) OUTPUT
	 ,@DonationsMonthlyAmount decimal(15,2) OUTPUT
	 ,@DonationsWeeklyCount bigint OUTPUT
	 ,@DonationsMonthlyCount bigint OUTPUT)
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	
	SET NOCOUNT ON;

    -- Insert statements for procedure here
    
    BEGIN TRY		
		
		-- Members Recently submitted

		IF(@Items <> 0)
		BEGIN
		
			SELECT Top(@Items) 
			 M.MemberId  
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
			 ,MO.PaymentMethodId   
			 ,(SELECT PaymentMethod FROM PaymentMethods pm1 WHERE pm1.PaymentMethodId=MO.PaymentMethodId)  
			 ,(SELECT PaymentStatus FROM PaymentStatus ps WHERE ps.PaymentStatusId=MO.PaymentStatusId)  
			 ,AdminComment   
			 ,UserComment
			 ,PS.PaymentStatus
			 ,PM.PaymentMethod
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
			 LEFT JOIN PaymentMethods PM ON PM.PaymentMethodId=MO.PaymentMethodId    
			 WHERE M.MemberId <> 0 and M.IsApproved = 1 and PS.PaymentStatus = 'Completed' and MO.ExpiryDate >= CAST(GETUTCDATE() as nvarchar(50))
				
		END


		IF(@Items <> 0)
		BEGIN
		
			SELECT Top(@Items) 
			 M.MemberId  
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
			 ,MO.PaymentMethodId   
			 ,(SELECT PaymentMethod FROM PaymentMethods pm1 WHERE pm1.PaymentMethodId=MO.PaymentMethodId)  
			 ,(SELECT PaymentStatus FROM PaymentStatus ps WHERE ps.PaymentStatusId=MO.PaymentStatusId)  
			 ,AdminComment   
			 ,UserComment
			 ,PS.PaymentStatus
			 ,PM.PaymentMethod
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
			 LEFT JOIN PaymentMethods PM ON PM.PaymentMethodId=MO.PaymentMethodId    
			 WHERE M.MemberId <> 0 and MO.ExpiryDate < CAST(GETUTCDATE() as nvarchar(50));
				
		END

		--Donation Recently submitted
		IF(@Items <> 0)
		BEGIN
		
			SELECT Top(@Items) 
			 
						 D.ServiceDonationId
						 ,D.MemberId
						,D.ServiceId
						,(select ServiceTitle from services where ServiceId=D.ServiceId) as DonationCause
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
						,K.PhoneNo 
						FROM ServiceDonations D
						LEFT JOIN ServiceDonationInfo K ON D.ServiceDonationId=K.ServiceDonationId 
						LEFT JOIN PaymentMethods PM ON PM.PaymentMethodId=D.PaymentMethodId
						LEFT JOIN PaymentStatus PS ON PS.PaymentStatusId=D.PaymentStatusId 
						WHERE D.ServiceDonationId <> 0 
						AND D.Amount <> 0
				
		END

		--Events Recently submitted
		IF(@Items <> 0)
		BEGIN

		 SELECT    E.EventId  
              ,E.ChapterId  
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
			  ,E.IsActive 
			  ,Flyer   
			 ,(Select EC.EventCategory From EventCategories EC where EC.EventCategoryId = E.EventCategoryId) as EventCategory  
			  ,(Select Count(*) From EventUserInfo EI where EI.EventId = E.EventId) as UsersCount  
			  FROM Events  E   

			  WHERE E.EventId <> 0 AND E.EventId in (Select Ed.EventId from Events ED Where (CONVERT (DATE,ED.StartDate)  >= CONVERT (DATE,GETDATE()) OR ED.StartDate IS NULL OR CONVERT (DATE, ED.StartDate)  <=  CONVERT (DATE, GETDATE()) OR ED.StartDate IS NULL OR ED.EndDate IS NULL) AND ED.EndDate > CONVERT (DATE, GETDATE()))

		END


		SELECT @MembersActiveCount = COUNT(*) FROM Members M LEFT JOIN MembershipOrders MO ON MO.MemberId=M.MemberId LEFT JOIN PaymentStatus PS ON PS.PaymentStatusId=MO.PaymentStatusId    
			 WHERE M.MemberId <> 0 and M.IsApproved = 1 and PS.PaymentStatus = 'Completed' and MO.ExpiryDate >= CAST(GETUTCDATE() as nvarchar(50));
		
		SELECT @MembersActiveSumAmount = SUM(MO.Amount) FROM Members M LEFT JOIN MembershipOrders MO ON MO.MemberId=M.MemberId LEFT JOIN PaymentStatus PS ON PS.PaymentStatusId=MO.PaymentStatusId    
			 WHERE M.MemberId <> 0 and M.IsApproved = 1 and PS.PaymentStatus = 'Completed' and MO.ExpiryDate >= CAST(GETUTCDATE() as nvarchar(50));


			 	SELECT @MembersInActiveCount = COUNT(*) FROM Members M LEFT JOIN MembershipOrders MO ON MO.MemberId=M.MemberId LEFT JOIN PaymentStatus PS ON PS.PaymentStatusId=MO.PaymentStatusId    
			 WHERE M.MemberId <> 0 and MO.ExpiryDate < CAST(GETUTCDATE() as nvarchar(50));
		
		SELECT @MembersInActiveSumAmount = SUM(MO.Amount) FROM Members M LEFT JOIN MembershipOrders MO ON MO.MemberId=M.MemberId LEFT JOIN PaymentStatus PS ON PS.PaymentStatusId=MO.PaymentStatusId    
			 WHERE M.MemberId <> 0 and MO.ExpiryDate < CAST(GETUTCDATE() as nvarchar(50));


						SELECT @DonationsWeeklyAmount = SUM(D.Amount) FROM ServiceDonations D
						LEFT JOIN ServiceDonationInfo K ON D.ServiceDonationId=K.ServiceDonationId 
						LEFT JOIN PaymentMethods PM ON PM.PaymentMethodId=D.PaymentMethodId
						LEFT JOIN PaymentStatus PS ON PS.PaymentStatusId=D.PaymentStatusId 
						WHERE D.ServiceDonationId <> 0 
						AND D.Amount <> 0 AND D.OrderDate  > CONVERT(date, getdate() - 7);


						SELECT @DonationsMonthlyAmount = SUM(D.Amount) FROM ServiceDonations D
						LEFT JOIN ServiceDonationInfo K ON D.ServiceDonationId=K.ServiceDonationId 
						LEFT JOIN PaymentMethods PM ON PM.PaymentMethodId=D.PaymentMethodId
						LEFT JOIN PaymentStatus PS ON PS.PaymentStatusId=D.PaymentStatusId 
						WHERE D.ServiceDonationId <> 0 
						AND D.Amount <> 0 AND D.OrderDate  > CONVERT(date, getdate() - 30);

						    SELECT @DonationsWeeklyCount = COUNT(*) FROM ServiceDonations D
						LEFT JOIN ServiceDonationInfo K ON D.ServiceDonationId=K.ServiceDonationId 
						LEFT JOIN PaymentMethods PM ON PM.PaymentMethodId=D.PaymentMethodId
						LEFT JOIN PaymentStatus PS ON PS.PaymentStatusId=D.PaymentStatusId 
						WHERE D.ServiceDonationId <> 0 
						AND D.Amount <> 0 AND D.OrderDate  > CONVERT(date, getdate() - 7);


						SELECT @DonationsMonthlyCount =  COUNT(*) FROM ServiceDonations D
						LEFT JOIN ServiceDonationInfo K ON D.ServiceDonationId=K.ServiceDonationId 
						LEFT JOIN PaymentMethods PM ON PM.PaymentMethodId=D.PaymentMethodId
						LEFT JOIN PaymentStatus PS ON PS.PaymentStatusId=D.PaymentStatusId 
						WHERE D.ServiceDonationId <> 0 
						AND D.Amount <> 0 AND D.OrderDate  > CONVERT(date, getdate() - 30);

		
		SELECT @Qstatus = 1;    
		
    END TRY    
    BEGIN CATCH    
		SELECT @Qstatus = -1;    
    END CATCH
END












GO
/****** Object:  StoredProcedure [dbo].[AdminMenuItemsDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[AdminMenuItemsDelete]
    (@MenuItemId bigint
    ,@QStatus int OUTPUT)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;

    BEGIN TRY    
		DELETE FROM AdminMenuItems WHERE MenuItemId = @MenuItemId	    
		SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END












GO
/****** Object:  StoredProcedure [dbo].[AdminMenuItemsGetAll]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[AdminMenuItemsGetAll]
    (@QStatus int OUTPUT)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from

	SET NOCOUNT ON;

    BEGIN TRY    
    
		SELECT MenuItemId
			  ,DisplayName 
			  ,PageLevel
			  ,PageParentId
			  ,IdPath 
			  ,Position
			  ,IsFooterBar
			  ,IsMenuBar
			  ,IsTopBar
			  ,IsQuickLinks
			  ,IsActive
			  ,UpdatedBy
			  ,UpdatedDate
			  ,InsertedBy
			  ,InsertedDate
			  ,(SELECT IsActive FROM AdminMenuItems WHERE AdminMenuItems.MenuItemId = c.PageParentId) AS ParentActive 
			  ,(SELECT COUNT(*) FROM AdminMenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = c.MenuItemId AND IsActive = 1) AS SubMenuItemCount
			  FROM AdminMenuItems c WHERE c.IsActive = 1 ORDER BY IdPath, Position
	
		SELECT @QStatus = 1;

    END TRY
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END












GO
/****** Object:  StoredProcedure [dbo].[AdminMenuItemsGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[AdminMenuItemsGetById]
	(@MenuItemId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;

   BEGIN TRY 

		SELECT *, (Select DisplayName From AdminMenuItems Where MenuItemId = M.PageParentId) as ParentName FROM AdminMenuItems M WHERE MenuItemId = @MenuItemId
	    SELECT @QStatus = 1;
		
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH		
	 
END











GO
/****** Object:  StoredProcedure [dbo].[AdminMenuItemsGetByLevel]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[AdminMenuItemsGetByLevel]
	(@PageLevel int
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	   SET NOCOUNT ON;

    BEGIN TRY 
		SELECT * FROM AdminMenuItems  WHERE PageLevel = @PageLevel
		SELECT @QStatus = 1;
	END TRY

	BEGIN CATCH
		 SELECT @QStatus = -1;
	END CATCH		
	 
END











GO
/****** Object:  StoredProcedure [dbo].[AdminMenuItemsGetByName]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[AdminMenuItemsGetByName]
	(@DisplayName nvarchar(256)
    ,@QStatus int OUTPUT)    

AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;

	BEGIN TRY 
		SELECT * FROM AdminMenuItems  WHERE DisplayName = @DisplayName
	    SELECT @QStatus = 1;
    END TRY
    BEGIN CATCH
		SELECT @QStatus = -1;
    END CATCH		
	 
END











GO
/****** Object:  StoredProcedure [dbo].[AdminMenuItemsGetByParentId]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[AdminMenuItemsGetByParentId]
	(@PageParentId int
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;

    BEGIN TRY 
		SELECT * FROM AdminMenuItems  WHERE PageParentId = @PageParentId
	    SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH		
	 
END











GO
/****** Object:  StoredProcedure [dbo].[AdminMenuItemsGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[AdminMenuItemsGetList]
	@ChapterId bigint,
	@QStatus int OUTPUT
        
AS
BEGIN

	    -- SET NOCOUNT ON added to prevent extra result sets from

		DECLARE @Query nvarchar(max);
		DECLARE @Start int, @End INT ;
	    
		SET NOCOUNT ON;
		    
		SELECT MenuItemId
			  ,ChapterId
			  ,DisplayName  
			  ,PageLevel
			  ,PageParentId
			  ,IdPath 
			  ,IsFooterBar
			  ,IsMenuBar
			  ,IsTopBar
			  ,IsQuickLinks
			  ,Position
			  ,IsActive
			  ,UpdatedBy
			  ,UpdatedDate
			  ,InsertedBy
			  ,InsertedDate
			  ,(SELECT IsActive FROM AdminMenuItems WHERE AdminMenuItems.MenuItemId = c.PageParentId) AS ParentActive 
			  ,(SELECT COUNT(*) FROM AdminMenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = c.MenuItemId) AS SubMenuItemCount
			  ,(Select PageDetailId From MenuPages Where MenuItemId = c.MenuItemId) as PageDetailId
			  ,(Select MenuPageId From MenuPages Where MenuItemId = c.MenuItemId) as MenuPageId
			  ,(Select PageUrl From PageDetails Where PageDetailId = (Select PageDetailId From MenuPages Where MenuItemId = c.MenuItemId)) as PageUrl
			  ,(Select ShortName From Chapters Where ChapterId = c.ChapterId) as ChapterName
	          FROM AdminMenuItems c WHERE c.ChapterId = 1 ORDER BY Position ASC

	          SELECT @QStatus = 1;		
    
END




GO
/****** Object:  StoredProcedure [dbo].[AdminMenuItemsInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[AdminMenuItemsInsert]
    (@MenuItemId bigint
	,@ChapterId bigint
    ,@DisplayName nvarchar(256) 
	,@PageParentId bigint 
	,@IsTopBar bit
	,@IsMenuBar bit
	,@IsQuickLinks bit
	,@IsFooterBar bit
	,@Position int	
	,@PageUrl nvarchar(256)
	,@OtherUrl nvarchar(256)
	,@IsActive bit
    ,@UpdatedBy nvarchar(64)
	,@UpdatedDate datetime
	,@InsertedBy nvarchar(64)
	,@InsertedDate datetime
	,@QStatus int OUTPUT
	,@IsEdit bit
	,@IsView bit
	,@IsDelete bit
	,@IsExport bit)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	    SET NOCOUNT ON;

		DECLARE @IdPath nvarchar(512)
		DECLARE @PageLevel int
		
		IF((SELECT COUNT(*) FROM AdminMenuItems WHERE MenuItemId = @MenuItemId) = 0)
				BEGIN
					INSERT INTO AdminMenuItems VALUES
							(@ChapterId
							,@DisplayName 
							,NULL
							,@PageParentId
							,NULL 
							,@Position
							,@IsTopBar
							,@IsMenuBar
							,@IsQuickLinks
							,@IsFooterBar
							,@PageUrl
							,@OtherUrl
							,@IsActive
							,@UpdatedBy
							,@UpdatedDate
							,@InsertedBy
							,@InsertedDate
							,@IsEdit
							,@IsView
							,@IsDelete
							,@IsExport)
							SELECT @MenuItemId =  SCOPE_IDENTITY()
			 
					 IF(@PageParentId IS NULL)
						 BEGIN
							UPDATE AdminMenuItems SET IdPath = CAST(@MenuItemId as nvarchar(20)), PageLevel = 1  WHERE MenuItemId = @MenuItemId				
						 END
					 ELSE
						 BEGIN
							SELECT @IdPath = IdPath, @PageLevel = PageLevel + 1 FROM AdminMenuItems WHERE MenuItemId = @PageParentId
							UPDATE AdminMenuItems SET IdPath = @IdPath + '/' + CAST(@MenuItemId as nvarchar(20)), PageLevel = @PageLevel WHERE MenuItemId = @MenuItemId							 
						 END
					 SELECT @QStatus = 1;	
				END

		ELSE
				BEGIN
					UPDATE AdminMenuItems
					   SET  ChapterId = @ChapterId
						   ,DisplayName=@DisplayName 
						   ,PageParentId=@PageParentId 
						   ,IsFooterBar=@IsFooterBar
						   ,IsMenuBar=@IsMenuBar
						   ,IsTopBar=@IsTopBar
						   ,IsQuickLinks=@IsQuickLinks 
						   ,Position = @Position
						   ,PageUrl=  @PageUrl
						   ,OtherUrl= @OtherUrl 
						   ,UpdatedBy=@UpdatedBy
						   ,UpdatedDate=@UpdatedDate
						   ,InsertedBy=@InsertedBy
						   ,InsertedDate=@InsertedDate 
						   ,IsEdit=@IsEdit
						   ,IsView=@IsView
						   ,IsDelete=@IsDelete
						   ,IsExport=@IsExport
					WHERE MenuItemId = @MenuItemId
			
					IF(@PageParentId IS NULL)
						 BEGIN
							UPDATE AdminMenuItems SET IdPath = CAST(@MenuItemId as nvarchar(20)), PageLevel = 1  WHERE MenuItemId = @MenuItemId				
						 END
				    ELSE
						 BEGIN
							SELECT @IdPath = IdPath, @PageLevel = PageLevel + 1 FROM AdminMenuItems WHERE MenuItemId = @PageParentId
							UPDATE AdminMenuItems SET IdPath = @IdPath + '/' + CAST(@MenuItemId as nvarchar(20)), PageLevel = @PageLevel WHERE MenuItemId = @MenuItemId							 
						 END
					SELECT @QStatus = 2;	
				END
END



GO
/****** Object:  StoredProcedure [dbo].[AdminMenuItemsUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[AdminMenuItemsUpdateStatus]
       (@MenuItemId bigint
       ,@QStatus bigint OUTPUT)
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from

	SET NOCOUNT ON;
	
	BEGIN TRY
	
			DECLARE @Query1 nvarchar(max)
			DECLARE @Query2 nvarchar(max)
			DECLARE @IsActive int
			
			IF((SELECT IsActive FROM AdminMenuItems WHERE MenuItemId = @MenuItemId) = 'True')
				BEGIN
					SET @IsActive = 0
				END
			ELSE
				BEGIN
					SET @IsActive = 1
				END
			SET @Query1 = 'UPDATE AdminMenuItems SET IsActive = ' + CAST(@IsActive AS Nvarchar(10)) + ' WHERE MenuItemId IN (' + CAST((select dbo.SelectAdminMenuItemsIdList(@MenuItemId,6)) as nvarchar(max)) + ')'
				 
			EXEC sp_ExecuteSQL @Query1;
			 
		    SELECT @QStatus = 1;
	END TRY
	
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH  
    
END











GO
/****** Object:  StoredProcedure [dbo].[AdminUsersGetByEmail]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[AdminUsersGetByEmail]
	(@Email nvarchar(128)
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from

    SET NOCOUNT ON;

    BEGIN TRY 
	       SELECT  U.UserId
				  ,U.UserName
				  ,U.Email
				  ,U.Password
				  ,U.Designation
				  ,U.MobilePhone
				  ,U.ProfileImage
				  ,U.IsApproved
				  ,U.IsLockedOut
				  ,U.IsActivated
				  ,U.DateActivated
				  ,U.RegistrationGUID
				  ,U.FailedPasswordAttemptCount
				  ,U.LastPasswordChangedDate
				  ,U.LastLoginDate
				  ,U.InsertedTime
				  ,U.InsertedBy
				  ,U.UpdatedTime
				  ,U.UpdatedBy	
				  ,(SELECT CAST((SELECT CAST(RoleId as nvarchar(80)) + ',' FROM Roles R  WHERE RoleId IN (SELECT RoleId FROM UserRoles WHERE RoleId=R.RoleId AND UserId=U.UserId) FOR XML PATH('')) AS NVARCHAR(max))) as RoleIds
				  ,(SELECT CAST((SELECT CAST(RoleName as nvarchar(80)) + ',' FROM Roles R  WHERE RoleId IN (SELECT RoleId FROM UserRoles WHERE RoleId=R.RoleId AND UserId=U.UserId) FOR XML PATH('')) AS NVARCHAR(max))) as RoleName
			  	  ,ChapterId	  
			      FROM Users U  
			      WHERE U.Email = @Email
		 SELECT @QStatus = 1;
		 
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END











GO
/****** Object:  StoredProcedure [dbo].[AppInfoGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[AppInfoGetList]
    @QStatus int output,
	 @Type nvarchar(256)
        
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY

		SELECT a.*
		--,(select top(1) Field1 from PhotosSettings) as IsQRCode,
		--(select top(1) Field2 from PhotosSettings) as EmaisToBrevo,
		--(select top(1) Field3 from PhotosSettings) as IsPromoCodes,
		--(select top(1) IsCultural from PhotosSettings) as IsCultural,
		--(select top(1) IsSports from PhotosSettings) as IsSports,
		--(select top(1) IsHelpDocument from PhotosSettings) as IsHelpDocument,
		--(select top(1) IsFeaturesDocument from PhotosSettings) as IsFeaturesDocument,
		--(select top(1) TimeZone from PhotosSettings) as TimeZone,
		--(SELECT CASE WHEN IsActive = 1 THEN 'Yes' ELSE 'No' END AS chapterStatus FROM AdminMenuItems WHERE MenuItemId = 50) as chapterStatus

		FROM AppInfo a where a.TollFreeNumber = @Type

		SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END































GO
/****** Object:  StoredProcedure [dbo].[AppInfoGetListByChapterId]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[AppInfoGetListByChapterId]
    @ChapterId bigint,
    @QStatus int output
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY
		SELECT * FROM AppInfo Where ChapterId = @ChapterId
		SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END































GO
/****** Object:  StoredProcedure [dbo].[AppInfoInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[AppInfoInsert]
    (@AppInfoId bigint
	,@ChapterId bigint
	,@SiteName nvarchar(128)
	,@CompanyAddress nvarchar(512)
	,@CompanyWebSite nvarchar(256)
	,@CompanyEmail nvarchar(60)
	,@CompanyPhone nvarchar(64)
	,@PresidentEmail nvarchar(128)
	,@PresidentPhone nvarchar(25)
	,@SecretaryEmail nvarchar(128)
	,@SecretaryPhone nvarchar(128)
	,@CustomerCareNumber nvarchar(25)
	,@TollFreeNumber nvarchar(25)
	,@FacebookUrl nvarchar(512)
	,@TwitterUrl nvarchar(512)
	,@YoutubeUrl nvarchar(512)
	,@SupportEmail nvarchar(512)
	,@EnqueryEmail nvarchar(512)
	,@PageTitle nvarchar(1024)
	,@MetaDescription nvarchar(max)
	,@MetaKeywords nvarchar(max)
	,@Topline nvarchar(2024)
	,@PageItems int
	,@UpdatedBy nvarchar(64)
	,@UpdatedTime datetime
	,@QStatus int output
	,@BaseUrl	nvarchar(MAX)	
	,@UploadPath	nvarchar(MAX)	
	,@UserUploadPath	nvarchar(MAX)	
	,@UserSiteUrl	nvarchar(1024)	
	,@ServerMapUrl	nvarchar(MAX)	
	,@AdminImageUrl	nvarchar(1024)	
	,@AdminSiteUrl	nvarchar(1024)	
	,@MailName	nvarchar(512)	
	,@SenderEmail	nvarchar(1024)	
	,@MemberEmail	nvarchar(1024)	
	,@ExhibitEmail	nvarchar(1024)	
	,@EventsEmail	nvarchar(1024)	
	,@ContactEmail	nvarchar(1024)	
	,@DonationEmail	nvarchar(1024)	
	,@VolunteerEmail	nvarchar(1024)	
	,@SponsorshipEmail	nvarchar(1024)	
	,@BrevoKey	nvarchar(MAX)	
	,@AndroidVersion	int	
	,@IOSVersion	int	
	,@DesktopVersion	int	
	,@AppUpdate	nvarchar(256)	
	,@CapchaSiteKey	nvarchar(MAX)	
	,@CapchaSecreatKey	nvarchar(MAX)	
	,@ShowCapcha	nvarchar(256)	
	,@InstagramUrl nvarchar(1024)
	,@GooglePlusUrl nvarchar(1024)
	,@WhatsappNumber nvarchar(256)
	,@WhatsappScript nvarchar(MAX)
    ,@GoogleAnalyticsScript nvarchar(MAX)
	)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;

		IF((SELECT COUNT(*) FROM AppInfo WHERE AppInfoId = @AppInfoId) = 1)
		BEGIN
			UPDATE AppInfo
			   SET   SiteName=@SiteName
					,CompanyAddress=@CompanyAddress
					,CompanyWebSite=@CompanyWebSite
					,CompanyEmail= @CompanyEmail
					,CompanyPhone=@CompanyPhone
					,PresidentEmail =@PresidentEmail
					,PresidentPhone=@PresidentPhone
					,SecretaryEmail=@SecretaryEmail
					,SecretaryPhone=@SecretaryPhone
					,CustomerCareNumber=@CustomerCareNumber
					,FacebookUrl=@FacebookUrl
					,TwitterUrl=@TwitterUrl
					,YoutubeUrl=@YoutubeUrl
					,SupportEmail=@SupportEmail
					,EnqueryEmail=@EnqueryEmail
					,PageTitle=@PageTitle
					,MetaDescription=@MetaDescription
					,MetaKeywords=@MetaKeywords
					,Topline=@Topline
					,PageItems=@PageItems
					,UpdatedBy=@UpdatedBy
					,UpdatedTime=@UpdatedTime
					,BaseUrl=@BaseUrl	
					,UploadPath=@UploadPath		
					,UserUploadPath=@UserUploadPath	
					,UserSiteUrl=@UserSiteUrl		
					,ServerMapUrl=@ServerMapUrl	
					,AdminImageUrl=@AdminImageUrl		
					,AdminSiteUrl=@AdminSiteUrl	
					,MailName=@MailName	
					,SenderEmail=@SenderEmail
					,MemberEmail=@MemberEmail	
					,ExhibitEmail=@ExhibitEmail	
					,EventsEmail=@EventsEmail	
					,ContactEmail=@ContactEmail	
					,DonationEmail=@DonationEmail		
					,VolunteerEmail=@VolunteerEmail
					,SponsorshipEmail=@SponsorshipEmail	
					,BrevoKey=@BrevoKey	
					,AndroidVersion=@AndroidVersion
					,IOSVersion=@IOSVersion	
					,DesktopVersion=@DesktopVersion
					,AppUpdate=@AppUpdate	
					,CapchaSiteKey=@CapchaSiteKey		
					,CapchaSecreatKey=@CapchaSecreatKey
					,ShowCapcha=@ShowCapcha
					,InstagramUrl=@InstagramUrl
					,GooglePlusUrl=@GooglePlusUrl
					,WhatsappNumber=@WhatsappNumber
					,WhatsappScript = @WhatsappScript
                   ,GoogleAnalyticsScript=@GoogleAnalyticsScript
			 WHERE AppInfoId = @AppInfoId				
				
			SELECT @QStatus = 2;	
		END
		ELSE
		BEGIN
			 INSERT INTO AppInfo VALUES
				(   @ChapterId 
				    ,@SiteName
					,@CompanyAddress
					,@CompanyWebSite
					,@CompanyEmail 
					,@CompanyPhone
					,@PresidentEmail 
					,@PresidentPhone
					,@SecretaryEmail
					,@SecretaryPhone
					,@CustomerCareNumber
					,@TollFreeNumber
					,@FacebookUrl
					,@TwitterUrl
					,@YoutubeUrl
					,@SupportEmail
					,@EnqueryEmail
					,@PageTitle
					,@MetaDescription
					,@MetaKeywords
					,@Topline
					,@PageItems
					,@UpdatedBy
					,@UpdatedTime
					,@BaseUrl	
					,@UploadPath		
					,@UserUploadPath	
					,@UserSiteUrl		
					,@ServerMapUrl	
					,@AdminImageUrl		
					,@AdminSiteUrl	
					,@MailName	
					,@SenderEmail
					,@MemberEmail	
					,@ExhibitEmail	
					,@EventsEmail	
					,@ContactEmail	
					,@DonationEmail		
					,@VolunteerEmail
					,@SponsorshipEmail	
					,@BrevoKey	
					,@AndroidVersion
					,@IOSVersion	
					,@DesktopVersion
					,@AppUpdate	
					,@CapchaSiteKey		
					,@CapchaSecreatKey
					,@ShowCapcha
					,@InstagramUrl
					,@GooglePlusUrl
					,@WhatsappNumber
					,@GoogleAnalyticsScript
					,@WhatsappScript)	
			 		 
			 SELECT @QStatus = 1;	
		END

END



















GO
/****** Object:  StoredProcedure [dbo].[ApplyNowDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ApplyNowDelete]
    (@ApplyNowId bigint
    ,@QStatus int output )  
        
AS
BEGIN
--Sp_help ApplyNow
	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY  
		    BEGIN TRANSACTION  
			DELETE FROM ApplyNow WHERE ApplyNowId = @ApplyNowId		
			SELECT @QStatus = 1;
			COMMIT TRANSACTION		
    END TRY

    BEGIN CATCH
    ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END














GO
/****** Object:  StoredProcedure [dbo].[ApplyNowGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ApplyNowGetById]
	(@ApplyNowId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
--Sp_help ApplyNow
	-- SET NOCOUNT ON added to prevent extra result sets from
	
   SET NOCOUNT ON;

    BEGIN TRY 
		 SELECT *  from ApplyNow where ApplyNowId	=	@ApplyNowId
		 
		 SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END











GO
/****** Object:  StoredProcedure [dbo].[ApplyNowGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ApplyNowGetListByVariable]
	 (@FromDate nvarchar(126)
	 ,@ToDate nvarchar(126)
	 ,@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
    --Sp_help ApplyNow

    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
				,ApplyNowId	bigint
				,FirstName	nvarchar(128)
				,LastName	nvarchar(128)
				,PhoneNo	nvarchar(128)
				,Email	nvarchar(128)
				,Address	nvarchar(1024)
				,City	nvarchar(128)
				,State	nvarchar(128)
				,ZipCode	nvarchar(128)
				,ProgramInterest	nvarchar(512)
				,ProgramBegin	nvarchar(512)
				,Description	nvarchar(512)
				,IsActive	bit
				,IpAddress	nvarchar(max)
				,InsertedBy	nvarchar(512)
				,InsertedDate	datetime
				,UpdatedBy	nvarchar(512)
				,UpdatedDate	datetime
				)
				
	SELECT @Start = (@PageNo - 1) * @Items  
	   
	SELECT @End = @Start + @Items 
	
	SET @Query = 'INSERT INTO #temp SELECT 
	                 AN.ApplyNowId
					,AN.FirstName
					,AN.LastName
					,AN.PhoneNo
					,AN.Email
					,AN.Address
					,AN.City
					,AN.State
					,AN.ZipCode
					,AN.ProgramInterest
					,AN.ProgramBegin
					,AN.Description
					,AN.IsActive
					,AN.IpAddress
					,AN.InsertedBy
					,AN.InsertedDate
					,AN.UpdatedBy
					,AN.UpdatedDate

				FROM ApplyNow AN
		        WHERE AN.ApplyNowId <> 0 '

	
		IF(@Search <> '')
			BEGIN
				--SET @Query = @Query + ' AND  AN.FullName LIKE ''%' + @Search + '%'''
				SET @Query = @Query + ' AND (AN.FirstName LIKE ''%' + @Search + '%'' OR AN.LastName LIKE ''%' + @Search + '%'' OR AN.Email LIKE ''%' + @Search + '%'')'    
			END

	



		IF(@FromDate <> '' OR @ToDate <> '')
		BEGIN
			IF(@FromDate <> '' AND @ToDate <> '')
				BEGIN
				Set @Query = @Query + ' AND Convert(Date, AN.InsertedDate) Between CONVERT(date,'''+@FromDate+''',103) AND CONVERT(date,'''+@ToDate+''',103)'

					--SET @Query = @Query + ' AND  (Convert(Date, AN.InsertedDate) >= ''' + @FromDate + ''' AND Convert(Date, AN.InsertedDate) <= ''' + @ToDate + ''')'
				END 

			IF(@FromDate <> '' AND @ToDate = '')
				BEGIN
					SET @Query = @Query + ' AND CONVERT(date,  AN.InsertedDate) >= CONVERT(date,'''+@FromDate+''',103)'

					--SET @Query = @Query + ' AND  Convert(Date,AN.InsertedDate) >= ''' + @FromDate + ''''
				END 
			IF(@FromDate = '' AND @ToDate <> '')
				BEGIN
					SET @Query = @Query + ' AND CONVERT(date,  AN.InsertedDate) <= CONVERT(date,'''+@ToDate+''',103)' 

					--SET @Query = @Query + ' AND Convert(Date, AN.InsertedDate) <= ''' + @ToDate + ''''
				END
	    END 

		IF(@Sort <> '')
			BEGIN
				SET @Query = @Query + ' ORDER BY ' + @Sort
			END
	
		EXEC sp_ExecuteSQL @Query;
		print @Query
		
		SELECT @Total = COUNT(Rid) from #temp 
				
		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
		DROP TABLE #temp
 
END












GO
/****** Object:  StoredProcedure [dbo].[ApplyNowInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ApplyNowInsert]
    (@ApplyNowId bigint output
	,@FirstName	nvarchar(128)
	,@LastName	nvarchar(128)
	,@PhoneNo	nvarchar(128)
	,@Email	nvarchar(128)
	,@Address	nvarchar(max)
	,@City	nvarchar(128)
	,@State	nvarchar(128)
	,@ZipCode	nvarchar(128)
	,@ProgramInterest	nvarchar(1024)
	,@ProgramBegin	nvarchar(1024)
	,@Description	nvarchar(max)
	,@IpAddress nvarchar(128)
	,@InsertedBy nvarchar(1024)
	,@UpdatedBy	nvarchar(1024)
	,@QStatus int output)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY
    BEGIN TRANSACTION
    IF((SELECT COUNT(*) FROM ApplyNow WHERE Email = @Email) = 0)
    BEGIN

        INSERT INTO ApplyNow VALUES

            (@FirstName
			,@LastName
			,@PhoneNo
			,@Email
			,@Address
			,@City
			,@State
			,@ZipCode
			,@ProgramInterest
			,@ProgramBegin
			,@Description
			,1
			,@IpAddress
			,@InsertedBy
			,(Convert(DateTime, SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')))
			,@UpdatedBy
			,(Convert(DateTime, SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')))
			)		

			SELECT @ApplyNowId = SCOPE_IDENTITY()
			
		SELECT @QStatus = 1;	
	END
	ELSE
	BEGIN
		UPDATE ApplyNow

		    SET	 FirstName	=	@FirstName
				,LastName	=	@LastName
				,PhoneNo	=	@PhoneNo
				,Email	=	@Email
				,Address	=	@Address
				,City	=	@City
				,State	=	@State
				,ZipCode	=	@ZipCode
				,ProgramInterest	=	@ProgramInterest
				,ProgramBegin	=	@ProgramBegin
				,Description	=	@Description
				,IsActive	=	1
				,IpAddress	=	@IpAddress
				,UpdatedBy	= @UpdatedBy
				,UpdatedDate =	(Convert(DateTime, SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')))

		 WHERE ApplyNowId = @ApplyNowId
		 		 
		 SELECT @QStatus = 1;	
	END
    COMMIT TRANSACTION
    END TRY
    
    BEGIN CATCH    
    ROLLBACK TRANSACTION
		SELECT @QStatus = -1;    
    END CATCH    
END


















GO
/****** Object:  StoredProcedure [dbo].[ApplyNowUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ApplyNowUpdateStatus]
    (@ApplyNowId bigint
    ,@QStatus int output)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		BEGIN TRANSACTION

			IF((SELECT IsActive FROM ApplyNow WHERE ApplyNowId = @ApplyNowId) = 1)
				BEGIN
					UPDATE ApplyNow SET IsActive = 0 WHERE ApplyNowId = @ApplyNowId
				END
			ELSE
				BEGIN
					UPDATE ApplyNow SET IsActive = 1 WHERE ApplyNowId = @ApplyNowId
				END		
		
			SELECT @QStatus = 1;
		
		COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
    
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
		 
    END CATCH
    	
END










GO
/****** Object:  StoredProcedure [dbo].[AW_GetDataMainLayout]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

Create PROCEDURE [dbo].[AW_GetDataMainLayout] 
	(@UserId bigint
	,@RoleId bigint
    ,@QStatus int OUTPUT
	)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON; 
	BEGIN TRY 
	DECLARE @RoleName nvarchar(256);
	SET @RoleName = (SELECT RoleName FROM Roles WHERE RoleId = @RoleId);
	IF(@RoleName = 'SuperAdmin' OR @RoleName = 'DeveloperAdmin')
	BEGIN
			SELECT DISTINCT m.DisplayName,m.MenuItemId,m.PageUrl, m.PageParentId, m.Position
			FROM Role_Menu up, AdminMenuItems m 
			WHERE up.MenuId=m.MenuItemId and m.IsActive=1
			and PageLevel=1 and up.EmployeeCompanyId=@UserId ORDER BY m.Position asc


			SELECT DISTINCT m.DisplayName,m.MenuItemId,m.PageUrl, m.IdPath, m.PageParentId, m.Position 
			FROM Role_Menu up, AdminMenuItems m 
			WHERE up.MenuId=m.MenuItemId and m.IsActive=1
			and 
			PageLevel=2 and up.EmployeeCompanyId=@UserId ORDER BY m.Position asc
	END
	ELSE
	BEGIN
	SELECT DISTINCT m.DisplayName,m.MenuItemId,m.PageUrl, m.PageParentId, m.Position
			FROM AdminMenuItems m 
			WHERE m.MenuItemId <> 0 AND m.IsActive=1
			and PageLevel=1 ORDER BY m.Position asc


			SELECT DISTINCT m.DisplayName,m.MenuItemId,m.PageUrl, m.IdPath, m.PageParentId, m.Position 
			FROM AdminMenuItems m 
			WHERE m.MenuItemId <> 0 and m.IsActive=1
			and 
			PageLevel=2 ORDER BY m.Position asc
	END
			 
			SELECT @QStatus = 1;
		 
	END TRY

	BEGIN CATCH
			SELECT @QStatus = -1;
	END CATCH
END



































GO
/****** Object:  StoredProcedure [dbo].[ChaptersDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[ChaptersDelete]
    (@ChapterId bigint
   ,@QStatus int output)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		BEGIN TRANSACTION
    
			DELETE FROM Chapters WHERE ChapterId = @ChapterId
		
			SELECT @QStatus = 1;
		
		COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION     
		 SELECT @QStatus = -1;
    END CATCH
    	
END












GO
/****** Object:  StoredProcedure [dbo].[ChaptersGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ChaptersGetById]

		   (@ChapterId bigint
           ,@QStatus int output)  
         
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
   SET NOCOUNT ON;

   BEGIN TRY 
         SELECT * from Chapters WHERE ChapterId = @ChapterId
	
		 SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	

END











GO
/****** Object:  StoredProcedure [dbo].[ChaptersGetByName]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ChaptersGetByName]
           (@cname nvarchar(512)
           ,@QStatus int output)  
         
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
   SET NOCOUNT ON;

    BEGIN TRY 
       SELECT * from Chapters WHERE dbo.RemoveSpecialChar(ChapterName, '^a-z0-9') = dbo.RemoveSpecialChar(@cname, '^a-z0-9')
	   SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	

END











GO
/****** Object:  StoredProcedure [dbo].[ChaptersGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ChaptersGetList]
    @QStatus int output
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		SELECT * FROM Chapters Where IsActive = 1
		SELECT @QStatus = 1;	
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END











GO
/****** Object:  StoredProcedure [dbo].[ChaptersGetListByCategoryId]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ChaptersGetListByCategoryId]
    @CommitteeCategoryId BIGINT
	,@QStatus int output
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		SELECT C.* FROM Chapters C
		INNER jOIN ChapterCommittees CC on CC.ChapterId = C.ChapterId 
		wHERE CC.CommitteeCategoryId = @CommitteeCategoryId

		SELECT @QStatus = 1;	
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END











GO
/****** Object:  StoredProcedure [dbo].[ChaptersGetListById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ChaptersGetListById]
    @CommitteeCategoryId BIGINT
	,@QStatus int output
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
    
		SELECT C.* FROM Chapters C
		INNER jOIN ChapterCommittees CC on CC.ChapterId = C.ChapterId 
		wHERE CC.CommitteeCategoryId = @CommitteeCategoryId

		SELECT @QStatus = 1;	
		
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END











GO
/****** Object:  StoredProcedure [dbo].[ChaptersGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE  PROCEDURE [dbo].[ChaptersGetListByVariable]  

	 (@Search nvarchar(128)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)

AS

BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from

	SET NOCOUNT ON;
	BEGIN TRY
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
						  ,ChapterId bigint
						  ,ChapterName  nvarchar(512)
						  ,ShortName  nvarchar(512)
						  ,ShortDescription  nvarchar(max)
						  ,Description  nvarchar(max)
						  ,Address  nvarchar(1024)
						  ,City  nvarchar(512)
						  ,State  nvarchar(512)
						  ,ZipCode  nvarchar(512)
						  ,IsActive bit
						  ,OrderNo bigint
						  ,UpdatedBy nvarchar(512)
						  ,UpdatedDate datetime)
						
	SELECT @Start = (@PageNo - 1) * @Items  

	SELECT @End = @Start + @Items 

	SET @Query = 'INSERT INTO #temp Select
	 
				 C.ChapterId
				,C.ChapterName
				,C.ShortName
				,C.ShortDescription
				,C.Description
				,C.Address
				,C.City
				,C.State
				,C.ZipCode
				,C.IsActive
				,C.OrderNo
				,C.UpdatedBy
				,C.UpdatedDate
				from Chapters  C
				WHERE  C.ChapterId <> 0 '


		IF(@Search <> '')
		BEGIN
			SET @Query = @Query + ' AND  C.ChapterName LIKE ''%' + @Search + '%'' OR C.ShortName LIKE ''%' + @Search + '%'' OR C.City LIKE ''%' + @Search + '%'' OR C.State LIKE ''%' + @Search + '%'''
		END
		IF(@Sort <> '')
		BEGIN
			SET @Query = @Query + ' ORDER BY ' + @Sort
		END

		EXEC sp_ExecuteSQL @Query;

		print @Query

		SELECT @Total = COUNT(Rid) from #temp 

		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End

		DROP TABLE #temp
	END TRY

    BEGIN CATCH  
       SELECT @Total = -1; 		   
    END CATCH   

END












GO
/****** Object:  StoredProcedure [dbo].[ChaptersInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
  
CREATE PROCEDURE [dbo].[ChaptersInsert]  
    (@ChapterId bigint  
 ,@ChapterName  nvarchar(512)  
 ,@ShortName  nvarchar(512)  
 ,@ShortDescription  nvarchar(max)  
 ,@Description  nvarchar(max)  
 ,@Address  nvarchar(1024)  
 ,@City  nvarchar(512)  
 ,@State  nvarchar(512)  
 ,@ZipCode  nvarchar(512)  
 ,@IsActive bit  
 ,@OrderNo bigint  
 ,@UpdatedBy nvarchar(512)  
 ,@UpdatedDate datetime  
  ,@CoordinatorName  nvarchar(max)  
   ,@CoordinatorEmail nvarchar(max)  
   ,@CoordinatorPhone nvarchar(max)  
   ,@IsNotification nvarchar(max)  
 ,@QStatus int output)    
          
AS  
BEGIN  
  
 -- SET NOCOUNT ON added to prevent extra result sets from  
   
 SET NOCOUNT ON;  
  
    IF((SELECT COUNT(*) FROM Chapters WHERE ChapterId = @ChapterId or ChapterName=@ChapterName) = 0)  
    BEGIN  
        INSERT INTO Chapters VALUES  
            (  
    @ChapterName  
   ,@ShortName  
   ,@ShortDescription  
   ,@Description  
   ,@Address  
   ,@City  
   ,@State  
   ,@ZipCode  
   ,@IsActive  
   ,@OrderNo  
   ,@UpdatedBy  
   ,@UpdatedDate 
   ,@CoordinatorName 
   ,@CoordinatorEmail
   ,@CoordinatorPhone
   ,@IsNotification)    
     
   SET @ChapterId = Scope_Identity();  
  
   If(@ShortDescription <> '')  
   BEGIN  
    IF(@Address <> '')  
    BEGIN  
     CREATE TABLE #level1(Rid INT PRIMARY KEY IDENTITY(1,1)  
     ,MenuItemId bigint)  
  
     INsert into #level1  
     Select MenuItemId from MenuItems where ChapterId = CAST(@ShortDescription as bigint) and PageLevel = 1  
  
     Declare @Start1 bigint;  
     Declare @End1 bigint;  
     Declare @PageDetailId1 bigint;  
     SET @Start1 = 1;  
     SET @End1 = (Select Count(*) from #level1);  
     while @Start1 <= @End1  
     BEGIN  
      Declare @MenuItemId1 bigint;  
      Declare @LM1 bigint;  
      Select @MenuItemId1 = MenuItemId from #level1 where Rid = @Start1  
      Insert Into MenuItems   
      Select @ChapterId, DisplayName, [PageLevel],[PageParentId],[IdPath],[Position],[IsTopBar],[IsMenuBar],[IsQuickLinks],[IsFooterBar],[IsActive],[UpdatedBy],[UpdatedDate],[InsertedBy],[InsertedDate] from MenuItems where MenuItemId = @MenuItemId1  
      Set @LM1 = Scope_Identity();  
        
      Update MenuItems Set IdPath = CAST(@LM1 as nvarchar(64)) Where MenuItemId = @LM1  
      IF(@Address = 'Menu Items With Pages')  
      BEGIN  
	  

       Insert Into PageDetails  
                 Select Heading,Description,PageUrl,DocumentUrl,Target,PageTitle,MetaDescription,MetaKeywords,TopLine,1,UpdatedBy,GetDate(),InsertedBy,GetDate(),'',''  
           From PageDetails  
           Where PageDetailId = (Select PageDetailId from MenuPages Where MenuItemId = @MenuItemId1)  
  
            Select @PageDetailId1 = Scope_Identity();  
  
       Insert Into MenuPages  
       Select @LM1, @PageDetailId1  
      END  
  
  
      CREATE TABLE #level2(Rid INT PRIMARY KEY IDENTITY(1,1)  
      ,MenuItemId bigint)  
  
      INsert into #level2  
      Select MenuItemId from MenuItems where ChapterId = CAST(@ShortDescription as bigint) and PageLevel = 2 and PageParentId = @MenuItemId1  
  
      Declare @Start2 bigint;  
      Declare @End2 bigint;  
      SET @Start2 = 1;  
      SET @End2 = (Select Count(*) from #level2);  
      while @Start2 <= @End2  
  
      BEGIN  
         
       Declare @MenuItemId2 bigint;  
       Declare @PageDetailId2 bigint;  
       Declare @LM2 bigint;  
       Select @MenuItemId2 = MenuItemId from #level2 where Rid = @Start2  
       Insert Into MenuItems   
       Select @ChapterId, DisplayName, [PageLevel],@LM1,[IdPath],[Position],[IsTopBar],[IsMenuBar],[IsQuickLinks],[IsFooterBar],[IsActive],[UpdatedBy],[UpdatedDate],[InsertedBy],[InsertedDate] from MenuItems where MenuItemId = @MenuItemId2  
       Set @LM2 = Scope_Identity();  
  
       Update MenuItems Set IdPath = CAST(@LM1 as nvarchar(64))+'/'+CAST(@LM2 as nvarchar(64)) Where MenuItemId = @LM2  
  
       IF(@Address = 'Menu Items With Pages')  
       BEGIN  
  
          Insert Into PageDetails  
                 Select Heading,Description,PageUrl,DocumentUrl,Target,PageTitle,MetaDescription,MetaKeywords,TopLine,1,UpdatedBy,GetDate(),InsertedBy,GetDate(),'',''  
           From PageDetails  
           Where PageDetailId = (Select PageDetailId from MenuPages Where MenuItemId = @MenuItemId2)  
  
           Select @PageDetailId2 = Scope_Identity();  
  
        Insert Into MenuPages  
        Select @LM2, @PageDetailId2  
       END  
  
       CREATE TABLE #level3(Rid INT PRIMARY KEY IDENTITY(1,1)  
       ,MenuItemId bigint)  
  
       INsert into #level3  
       Select MenuItemId from MenuItems where ChapterId = CAST(@ShortDescription as bigint) and PageLevel = 3 and PageParentId = @MenuItemId2  
  
       Declare @Start3 bigint;  
       Declare @End3 bigint;  
       SET @Start3 = 1;  
       SET @End3 = (Select Count(*) from #level3);  
       while @Start3 <= @End3  
  
       BEGIN  
        Declare @MenuItemId3 bigint;  
        Declare @PageDetailId3 bigint;  
        Declare @LM3 bigint;  
        Select @MenuItemId3 = MenuItemId from #level3 where Rid = @Start3  
        Insert Into MenuItems   
        Select @ChapterId, DisplayName, [PageLevel],@LM2,[IdPath],[Position],[IsTopBar],[IsMenuBar],[IsQuickLinks],[IsFooterBar],[IsActive],[UpdatedBy],[UpdatedDate],[InsertedBy],[InsertedDate] from MenuItems where MenuItemId = @MenuItemId3  
        Set @LM3 = Scope_Identity();  
  
        Update MenuItems Set IdPath = CAST(@LM1 as nvarchar(64))+'/'+CAST(@LM2 as nvarchar(64))+'/'+CAST(@LM3 as nvarchar(64)) Where MenuItemId = @LM3  
  
        IF(@Address = 'Menu Items With Pages')  
        BEGIN  
              Insert Into PageDetails  
                 Select Heading,Description,PageUrl,DocumentUrl,Target,PageTitle,MetaDescription,MetaKeywords,TopLine,1,UpdatedBy,GetDate(),InsertedBy,GetDate(),''  ,''
           From PageDetails  
           Where PageDetailId = (Select PageDetailId from MenuPages Where MenuItemId = @MenuItemId3)  
  
           Select @PageDetailId3 = Scope_Identity();  
  
         Insert Into MenuPages  
         Select @LM3, @PageDetailId3  
        END  
  
        SET @Start3 = @Start3 +1;  
       END  
  
       Drop table #level3  
  
       SET @Start2 = @Start2 +1;  
      END   
  
      Drop table #level2  
  
      SET @Start1 = @Start1 +1 ;  
     END  
  
     Drop table #level1  
    END   
   END   
  
  SELECT @QStatus = 1;   
 END  
 ELSE  
 BEGIN  
  UPDATE Chapters  
     SET ChapterName=@ChapterName,   
      ShortName=@ShortName ,  
      ShortDescription =@ShortDescription ,  
      Description=@Description ,  
      Address=@Address,  
      City=@City ,  
      State=@State ,  
      ZipCode=@ZipCode ,  
      OrderNo = @OrderNo,  
      UpdatedBy=@UpdatedBy ,  
      UpdatedDate=@UpdatedDate , 
	CoordinatorName = @CoordinatorName
   ,CoordinatorEmail= @CoordinatorEmail
   ,CoordinatorPhone= @CoordinatorPhone
   ,IsNotification= @IsNotification
   WHERE ChapterId = @ChapterId  
        
   SELECT @QStatus = 2;   
 END  
END  
  
  
  
  
  
  
  
  



GO
/****** Object:  StoredProcedure [dbo].[ChaptersUpdateDisplayOrder]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ChaptersUpdateDisplayOrder]
    (@ChapterId bigint
    ,@DisplayOrder int
    ,@QStatus int output)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
    BEGIN TRANSACTION
    
		IF((SELECT COUNT(*) FROM Chapters WHERE ChapterId = @ChapterId) = 1)
			BEGIN
				UPDATE Chapters SET OrderNo = @DisplayOrder WHERE ChapterId = @ChapterId
				SELECT @QStatus = 1;
			END
		ELSE
			BEGIN
				SELECT @QStatus = 3;
		    END	

	COMMIT TRANSACTION
    END TRY
		BEGIN CATCH
			 ROLLBACK TRANSACTION
			 SELECT @QStatus = -1;
		END CATCH
    	
END















GO
/****** Object:  StoredProcedure [dbo].[ChaptersUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ChaptersUpdateStatus]
    (@ChapterId bigint
    ,@QStatus int output)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
    BEGIN TRANSACTION
    
		IF((SELECT IsActive FROM Chapters WHERE ChapterId = @ChapterId) = 1)
			BEGIN
				UPDATE Chapters SET IsActive = 0 WHERE ChapterId = @ChapterId
			END
		ELSE
			BEGIN
				UPDATE Chapters SET IsActive = 1 WHERE ChapterId = @ChapterId
			END		
		
		SELECT @QStatus = 1;
		
	COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END













GO
/****** Object:  StoredProcedure [dbo].[Countrieslist]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[Countrieslist]
	(@QStatus int OUTPUT)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
   SET NOCOUNT ON;

    BEGIN TRY 
    
	     Select * from  demo3db.Countries
		 SELECT @QStatus = 1;
		 
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END






GO
/****** Object:  StoredProcedure [dbo].[CurrencyCodesList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[CurrencyCodesList]
    @QStatus int output
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		SELECT * FROM CurrencyCodes
		SELECT @QStatus = 1;	
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END
























GO
/****** Object:  StoredProcedure [dbo].[EmployeeOpportunitiesDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[EmployeeOpportunitiesDelete]
    (@EmployeeOpportunitiesId bigint
    ,@QStatus int output )  
        
AS
BEGIN
--Sp_help EmployeeOpportunities
	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY  
		    BEGIN TRANSACTION  
			DELETE FROM EmployeeOpportunities WHERE EmployeeOpportunitiesId = @EmployeeOpportunitiesId		
			SELECT @QStatus = 1;
			COMMIT TRANSACTION		
    END TRY

    BEGIN CATCH
    ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END














GO
/****** Object:  StoredProcedure [dbo].[EmployeeOpportunitiesGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[EmployeeOpportunitiesGetById]
	(@EmployeeOpportunitiesId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
   SET NOCOUNT ON;

    BEGIN TRY 
		 SELECT *  from EmployeeOpportunities where EmployeeOpportunitiesId	=	@EmployeeOpportunitiesId
		 
		 SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END











GO
/****** Object:  StoredProcedure [dbo].[EmployeeOpportunitiesGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[EmployeeOpportunitiesGetListByVariable] 
	 (@FromDate nvarchar(126)
	 ,@ToDate nvarchar(126)
	 ,@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);

    --Sp_help EmployeeOpportunities

    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
				,EmployeeOpportunitiesId	bigint
				,FirstName	nvarchar(128)
				,LastName	nvarchar(128)
				,PhoneNo	nvarchar(128)
				,Email	nvarchar(128)
				,CurrentJob	nvarchar(512)
				,Currentlive	nvarchar(128)
				,LinkedInUrl	nvarchar(128)
				,IsActive	bit
				,InsertedBy	nvarchar(512)
				,InsertedDate	datetime
				,UpdatedBy	nvarchar(512)
				,UpdatedDate	datetime
				)
				
	SELECT @Start = (@PageNo - 1) * @Items  
	   
	SELECT @End = @Start + @Items 
	
	SET @Query = 'INSERT INTO #temp SELECT 
	                 EO.EmployeeOpportunitiesId
					,EO.FirstName
					,EO.LastName
					,EO.PhoneNo
					,EO.Email
					,EO.CurrentJob
					,EO.Currentlive
					,EO.LinkedInUrl
					,EO.IsActive
					,EO.InsertedBy
					,EO.InsertedDate
					,EO.UpdatedBy
					,EO.UpdatedDate

				FROM EmployeeOpportunities EO
		        WHERE EO.EmployeeOpportunitiesId <> 0 '

	
		IF(@Search <> '')
			BEGIN
				--SET @Query = @Query + ' AND  EO.FullName LIKE ''%' + @Search + '%'''
				SET @Query = @Query + ' AND (EO.FirstName LIKE ''%' + @Search + '%'' OR EO.LastName LIKE ''%' + @Search + '%'' OR EO.Email LIKE ''%' + @Search + '%'')'    
			END

	

	IF(@FromDate <> '' OR @ToDate <> '')
		BEGIN
			IF(@FromDate <> '' AND @ToDate <> '')
				BEGIN
				Set @Query = @Query + ' AND Convert(Date, EO.InsertedDate) Between CONVERT(date,'''+@FromDate+''',103) AND CONVERT(date,'''+@ToDate+''',103)'

					--SET @Query = @Query + ' AND  (Convert(Date, EO.InsertedDate) >= ''' + @FromDate + ''' AND Convert(Date, EO.InsertedDate) <= ''' + @ToDate + ''')'
				END 

			IF(@FromDate <> '' AND @ToDate = '')
				BEGIN
					SET @Query = @Query + ' AND CONVERT(date,  EO.InsertedDate) >= CONVERT(date,'''+@FromDate+''',103)'

					--SET @Query = @Query + ' AND  Convert(Date,EO.InsertedDate) >= ''' + @FromDate + ''''
				END 
			IF(@FromDate = '' AND @ToDate <> '')
				BEGIN
					SET @Query = @Query + ' AND CONVERT(date,  EO.InsertedDate) <= CONVERT(date,'''+@ToDate+''',103)' 

					--SET @Query = @Query + ' AND Convert(Date, EO.InsertedDate) <= ''' + @ToDate + ''''
				END
	    END 


		IF(@Sort <> '')
			BEGIN
				SET @Query = @Query + ' ORDER BY ' + @Sort
			END
	
		EXEC sp_ExecuteSQL @Query;
		
		SELECT @Total = COUNT(Rid) from #temp 
				
		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
		DROP TABLE #temp
 
END












GO
/****** Object:  StoredProcedure [dbo].[EmployeeOpportunitiesInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[EmployeeOpportunitiesInsert]
    (@EmployeeOpportunitiesId bigint output
	,@FirstName	nvarchar(128)
	,@LastName	nvarchar(128)
	,@PhoneNo	nvarchar(128)
	,@Email	nvarchar(128)
	,@CurrentJob	nvarchar(1024)
	,@Currentlive	nvarchar(1024)
	,@LinkedInUrl	nvarchar(1024)
	,@Description	nvarchar(1024)
	,@IpAddress	nvarchar(max)
	,@InsertedBy	nvarchar
	,@UpdatedBy	nvarchar
	,@QStatus int output)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY
    BEGIN TRANSACTION
    IF((SELECT COUNT(*) FROM EmployeeOpportunities WHERE Email = @Email) = 0)
    BEGIN
	
        INSERT INTO EmployeeOpportunities VALUES

            (@FirstName
			,@LastName
			,@PhoneNo
			,@Email
			,@CurrentJob
			,@Currentlive
			,@LinkedInUrl
			,@Description
			,1
			,@IpAddress
			,@InsertedBy
			,(Convert(DateTime, SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')))
			,@UpdatedBy
			,(Convert(DateTime, SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')))
			)		

			SELECT @EmployeeOpportunitiesId = SCOPE_IDENTITY()
			
		SELECT @QStatus = 1;	
	END
	ELSE
	BEGIN
		UPDATE EmployeeOpportunities

		    SET	 FirstName = @FirstName
				,LastName	=	@LastName
				,PhoneNo	= @PhoneNo
				,Email	=	@Email
				,CurrentJob	=	@CurrentJob
				,Currentlive	=	@Currentlive
				,LinkedInUrl	=	@LinkedInUrl
				,Description	= @Description
				,IpAddress	=	@IpAddress
				,UpdatedBy	= @UpdatedBy
				,UpdatedDate =	(Convert(DateTime, SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')))

		 WHERE EmployeeOpportunitiesId = @EmployeeOpportunitiesId
		 		 
		 SELECT @QStatus = 1;	
	END
    COMMIT TRANSACTION
    END TRY
    
    BEGIN CATCH    
    ROLLBACK TRANSACTION
		SELECT @QStatus = -1;    
    END CATCH    
END


















GO
/****** Object:  StoredProcedure [dbo].[EmployeeOpportunitiesUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[EmployeeOpportunitiesUpdateStatus]
    (@EmployeeOpportunitiesId bigint
    ,@QStatus int output)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		BEGIN TRANSACTION

			IF((SELECT IsActive FROM EmployeeOpportunities WHERE EmployeeOpportunitiesId = @EmployeeOpportunitiesId) = 1)
				BEGIN
					UPDATE EmployeeOpportunities SET IsActive = 0 WHERE EmployeeOpportunitiesId = @EmployeeOpportunitiesId
				END
			ELSE
				BEGIN
					UPDATE EmployeeOpportunities SET IsActive = 1 WHERE EmployeeOpportunitiesId = @EmployeeOpportunitiesId
				END		
		
			SELECT @QStatus = 1;
		
		COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
    
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
		 
    END CATCH
    	
END










GO
/****** Object:  StoredProcedure [dbo].[EnquiriesDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[EnquiriesDelete]
    (@EnquiryId bigint
    ,@QStatus int output )  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY  
		    BEGIN TRANSACTION  
			DELETE FROM Enquiries WHERE EnquiryId = @EnquiryId		
			SELECT @QStatus = 1;
			COMMIT TRANSACTION		
    END TRY

    BEGIN CATCH
    ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END














GO
/****** Object:  StoredProcedure [dbo].[EnquiriesGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[EnquiriesGetById]
	(@EnquiryId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
   SET NOCOUNT ON;

    BEGIN TRY 
		 SELECT  EnquiryId
		        ,Name
				,Email
				,Description
				,Subject 
				,PhoneNo 
				,IsActive
				,InsertedTime 
				,Field1
				,Field2
		        from Enquiries where EnquiryId=@EnquiryId
		 
		 SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END











GO
/****** Object:  StoredProcedure [dbo].[EnquiriesGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[EnquiriesGetListByVariable] 
	 (@EventId bigint
	 ,@FromDate nvarchar(126)
	 ,@ToDate nvarchar(126)
	 ,@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
    
    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
				,EnquiryId bigint
				,Name nvarchar(128)
				,Email nvarchar(128)
				,Description nvarchar(1024)
				,Subject nvarchar(128)
				,PhoneNo nvarchar(512)
				,IsActive bit
				,InsertedTime datetime
				,Field1 nvarchar(512)
				,Field2 nvarchar(512)
				,ChapterName nvarchar(512))
				
	SELECT @Start = (@PageNo - 1) * @Items  
	   
	SELECT @End = @Start + @Items 
	
	SET @Query = 'INSERT INTO #temp SELECT 
	             E.EnquiryId
	            ,E.Name
	            ,E.Email
	            ,E.Description
	            ,E.Subject
	            ,E.PhoneNo
	            ,E.IsActive
	            ,E.InsertedTime 
				,E.Field1
				,E.Field2
				,(Select ChapterName from  Chapters Where ChapterName = E.Field1 ) as ChapterName
				FROM Enquiries E
		        WHERE E.EnquiryId <> 0 '

	
		IF(@Search <> '')
			BEGIN
				SET @Query = @Query + ' AND  E.Name LIKE ''%' + @Search + '%'''
			END

		IF(@EventId <> 0)
			BEGIN
				SET @Query = @Query + ' AND E.EventId= '+CAST(@EventId as nvarchar(250))
			END



		IF(@FromDate <> '' OR @ToDate <> '')
		BEGIN
			IF(@FromDate <> '' AND @ToDate <> '')
				BEGIN
					SET @Query = @Query + ' AND  (Convert(Date, E.InsertedTime) >= ''' + @FromDate + ''' AND Convert(Date, E.InsertedTime) <= ''' + @ToDate + ''')'
				END 

			IF(@FromDate <> '' AND @ToDate = '')
				BEGIN
					SET @Query = @Query + ' AND  Convert(Date,E.InsertedTime) >= ''' + @FromDate + ''''
				END 
			IF(@FromDate = '' AND @ToDate <> '')
				BEGIN
					SET @Query = @Query + ' AND Convert(Date, E.InsertedTime) <= ''' + @ToDate + ''''
				END
	    END 

		IF(@Sort <> '')
			BEGIN
				SET @Query = @Query + ' ORDER BY ' + @Sort
			END
	
		EXEC sp_ExecuteSQL @Query;
		
		SELECT @Total = COUNT(Rid) from #temp 
				
		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
		DROP TABLE #temp
 
END












GO
/****** Object:  StoredProcedure [dbo].[EnquiriesInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[EnquiriesInsert]
    (@EnquiryId bigint output
	,@EventId bigint
	,@Name nvarchar(128)
	,@Email nvarchar(128)
	,@Description nvarchar(1024)
	,@Subject nvarchar(128)
	,@PhoneNo nvarchar(50)
	,@IsActive bit
	,@InsertedTime datetime
	,@Field1 nvarchar(512)
	,@Field2 nvarchar(512)
	,@QStatus int output)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY
    BEGIN TRANSACTION
    IF((SELECT COUNT(*) FROM Enquiries WHERE EnquiryId = @EnquiryId) = 0)
    BEGIN
        INSERT INTO Enquiries VALUES
            (@EventId
			,@Name
            ,@Email
            ,@Description
            ,@Subject
            ,@PhoneNo
			,@IsActive
			,@InsertedTime
			,@Field1
			,@Field2)		

			SELECT @EnquiryId = SCOPE_IDENTITY()
			
		SELECT @QStatus = 1;	
	END
	ELSE
	BEGIN
		UPDATE Enquiries
		   SET EventId = @EventId
		       ,Name =@Name,
			   Email=@Email,
			   Description=@Description,
			   Subject=@Subject,
			   PhoneNo=@PhoneNo,
			   IsActive=@IsActive ,
			   InsertedTime=@InsertedTime,
			   Field1 = @Field1,
			   Field2 = @Field2

		 WHERE EnquiryId = @EnquiryId
		 		 
		 SELECT @QStatus = 1;	
	END
    COMMIT TRANSACTION
    END TRY
    
    BEGIN CATCH    
    ROLLBACK TRANSACTION
		SELECT @QStatus = -1;    
    END CATCH    
END


















GO
/****** Object:  StoredProcedure [dbo].[EnquiriesUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[EnquiriesUpdateStatus]
    (@EnquiryId bigint
    ,@QStatus int output)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		BEGIN TRANSACTION

			IF((SELECT IsActive FROM Enquiries WHERE EnquiryId = @EnquiryId) = 1)
				BEGIN
					UPDATE Enquiries SET IsActive = 0 WHERE EnquiryId = @EnquiryId
				END
			ELSE
				BEGIN
					UPDATE Enquiries SET IsActive = 1 WHERE EnquiryId = @EnquiryId
				END		
		
			SELECT @QStatus = 1;
		
		COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
    
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
		 
    END CATCH
    	
END










GO
/****** Object:  StoredProcedure [dbo].[ExistingMenuItemsGetbyId]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

Create PROCEDURE [dbo].[ExistingMenuItemsGetbyId]
	@PageDetailId bigint,
	@QStatus int OUTPUT
        
AS
BEGIN

	BEGIN TRY
		DECLARE @Query nvarchar(max);
		DECLARE @Start int, @End INT ;
	    
		SET NOCOUNT ON;
		    
		select * from MenuItems M where MenuItemid not in (select MenuItemid from MenuPages where MenuItemid=M.MenuItemid)

		union all
		select * from MenuItems M where  MenuItemid in (select MenuItemid from MenuPages where PageDetailId=@PageDetailId)
		

	          SELECT @QStatus = 1;		
	END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH  
    
END

GO
/****** Object:  StoredProcedure [dbo].[ExistingMenuItemsGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

Create PROCEDURE [dbo].[ExistingMenuItemsGetList]
	--@ChapterId bigint,
	@QStatus int OUTPUT
        
AS
BEGIN

	BEGIN TRY
		DECLARE @Query nvarchar(max);
		DECLARE @Start int, @End INT ;
	    
		SET NOCOUNT ON;
		    
		select * from MenuItems M where MenuItemid not in (select MenuItemid from MenuPages where MenuItemid=M.MenuItemid)

	          SELECT @QStatus = 1;		
	END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH  
    
END

















GO
/****** Object:  StoredProcedure [dbo].[ExportToApplyNow]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ExportToApplyNow] 
	  (@FromDate nvarchar(126)
	 ,@ToDate nvarchar(126)
	 ,@Search nvarchar(126)
	 ,@Sort nvarchar(216)
     ,@Total int OUTPUT)
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
 
	SET @Query = 'SELECT 
	                 AN.ApplyNowId
					,AN.FirstName
					,AN.LastName
					,AN.PhoneNo
					,AN.Email
					,AN.Address
					,AN.City
					,AN.State
					,AN.ZipCode
					,AN.ProgramInterest
					,AN.ProgramBegin
					,AN.Description
					,AN.InsertedBy
					,AN.InsertedDate
					,AN.UpdatedBy
					,AN.UpdatedDate

				FROM ApplyNow AN
		        WHERE AN.ApplyNowId <> 0 '

	
		IF(@Search <> '')
			BEGIN
				--SET @Query = @Query + ' AND  AN.FullName LIKE ''%' + @Search + '%'''
				SET @Query = @Query + ' AND (AN.FirstName LIKE ''%' + @Search + '%'' OR AN.LastName LIKE ''%' + @Search + '%'' OR AN.Email LIKE ''%' + @Search + '%'')'    
			END


		IF(@FromDate <> '' OR @ToDate <> '')
		BEGIN
			IF(@FromDate <> '' AND @ToDate <> '')
				BEGIN
				Set @Query = @Query + ' AND Convert(Date, AN.InsertedDate) Between CONVERT(date,'''+@FromDate+''',103) AND CONVERT(date,'''+@ToDate+''',103)'

					--SET @Query = @Query + ' AND  (Convert(Date, AN.InsertedDate) >= ''' + @FromDate + ''' AND Convert(Date, AN.InsertedDate) <= ''' + @ToDate + ''')'
				END 

			IF(@FromDate <> '' AND @ToDate = '')
				BEGIN
					SET @Query = @Query + ' AND CONVERT(date,  AN.InsertedDate) >= CONVERT(date,'''+@FromDate+''',103)'

					--SET @Query = @Query + ' AND  Convert(Date,AN.InsertedDate) >= ''' + @FromDate + ''''
				END 
			IF(@FromDate = '' AND @ToDate <> '')
				BEGIN
					SET @Query = @Query + ' AND CONVERT(date,  AN.InsertedDate) <= CONVERT(date,'''+@ToDate+''',103)' 

					--SET @Query = @Query + ' AND Convert(Date, AN.InsertedDate) <= ''' + @ToDate + ''''
				END
	    END 

		IF(@Sort <> '')
			BEGIN
				SET @Query = @Query + ' ORDER BY ' + @Sort
			END
	
		EXEC sp_ExecuteSQL @Query;
		
		SELECT @Total = COUNT(Rid) from #temp 
	
		DROP TABLE #temp
 
END












GO
/****** Object:  StoredProcedure [dbo].[ExportToEmployeeOpportunities]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ExportToEmployeeOpportunities] 
	 (@FromDate nvarchar(126)
	 ,@ToDate nvarchar(126)
	 ,@Search nvarchar(126)
	 ,@Sort nvarchar(216)
     ,@Total int OUTPUT)
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	BEGIN TRY 
	
			SET NOCOUNT ON;
			
			DECLARE @Start int, @End INT ;
			DECLARE @Query nvarchar(max);
			
	
			SET @Query = 'SELECT 
	                
					 EO.EmployeeOpportunitiesId
					,EO.FirstName
					,EO.LastName
					,EO.PhoneNo
					,EO.Email
					,EO.CurrentJob
					,EO.Currentlive
					,EO.LinkedInUrl
					,EO.InsertedBy
					,EO.InsertedDate 
					,EO.UpdatedBy
					,EO.UpdatedDate

				FROM EmployeeOpportunities EO
		        WHERE EO.EmployeeOpportunitiesId <> 0 '
			 
			
			IF(@Search <> '')
			BEGIN
				--SET @Query = @Query + ' AND  EO.FullName LIKE ''%' + @Search + '%'''
				SET @Query = @Query + ' AND (EO.FirstName LIKE ''%' + @Search + '%'' OR EO.LastName LIKE ''%' + @Search + '%'' OR EO.Email LIKE ''%' + @Search + '%'')'    
			END

	

	IF(@FromDate <> '' OR @ToDate <> '')
		BEGIN
			IF(@FromDate <> '' AND @ToDate <> '')
				BEGIN
				Set @Query = @Query + ' AND Convert(Date, EO.InsertedDate) Between CONVERT(date,'''+@FromDate+''',103) AND CONVERT(date,'''+@ToDate+''',103)'

					--SET @Query = @Query + ' AND  (Convert(Date, EO.InsertedDate) >= ''' + @FromDate + ''' AND Convert(Date, EO.InsertedDate) <= ''' + @ToDate + ''')'
				END 

			IF(@FromDate <> '' AND @ToDate = '')
				BEGIN
					SET @Query = @Query + ' AND CONVERT(date,  EO.InsertedDate) >= CONVERT(date,'''+@FromDate+''',103)'

					--SET @Query = @Query + ' AND  Convert(Date,EO.InsertedDate) >= ''' + @FromDate + ''''
				END 
			IF(@FromDate = '' AND @ToDate <> '')
				BEGIN
					SET @Query = @Query + ' AND CONVERT(date,  EO.InsertedDate) <= CONVERT(date,'''+@ToDate+''',103)' 

					--SET @Query = @Query + ' AND Convert(Date, EO.InsertedDate) <= ''' + @ToDate + ''''
				END
	    END 

	

			
			IF(@Sort <> '')
			BEGIN
				SET @Query = @Query + ' ORDER BY ' + @Sort
			END
			
			EXEC sp_ExecuteSQL @Query;
			print @Query;
			SELECT @Total = 1;
			
    END TRY
    BEGIN CATCH
		 SELECT @Total = -1;
    END CATCH
	 
END











GO
/****** Object:  StoredProcedure [dbo].[ExportToEnquiries]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ExportToEnquiries]
	 (@EventId bigint
	 ,@FromDate nvarchar(126)
	 ,@ToDate nvarchar(126)
	 ,@Search nvarchar(126)
	 ,@Sort nvarchar(216)
     ,@Total int OUTPUT)
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	BEGIN TRY 
	
			SET NOCOUNT ON;
			
			DECLARE @Start int, @End INT ;
			DECLARE @Query nvarchar(max);
			
			SET @Query = 'SELECT  E.EnquiryId
						,E.Name	
						,E.Email	
						,E.PhoneNo		
						,E.Subject		
						,E.Description												  
				         FROM Enquiries E where E.EnquiryId <> 0 '
			 
			
			IF(@Search <> '')
			BEGIN
				SET @Query = @Query + ' AND  E.Name LIKE ''%' + @Search + '%'' OR  E.Email LIKE ''%' + @Search + '%'' OR  E.PhoneNo LIKE ''%' + @Search + '%'''
			END

			IF(@EventId <> 0)
			BEGIN
				SET @Query = @Query + ' AND E.EventId= '+CAST(@EventId as nvarchar(250))
			END



			IF(@FromDate <> '' OR @ToDate <> '')
	  		BEGIN
				IF(@FromDate <> '' AND @ToDate <> '')
				BEGIN
					SET @Query = @Query + ' AND  (Convert(Date, E.InsertedTime) >= ''' + @FromDate + ''' AND Convert(Date, E.InsertedTime) <= ''' + @ToDate + ''')'
				END 

				IF(@FromDate <> '' AND @ToDate = '')
				BEGIN
					SET @Query = @Query + ' AND  Convert(Date,E.InsertedTime) >= ''' + @FromDate + ''''
				END 

				IF(@FromDate = '' AND @ToDate <> '')
				BEGIN
					SET @Query = @Query + ' AND Convert(Date, E.InsertedTime) <= ''' + @ToDate + ''''
	 			END
			END 

			
			IF(@Sort <> '')
			BEGIN
				SET @Query = @Query + ' ORDER BY ' + @Sort
			END
			
			EXEC sp_ExecuteSQL @Query;
			SELECT @Total = 1;
			
    END TRY
    BEGIN CATCH
		 SELECT @Total = -1;
    END CATCH
	 
END











GO
/****** Object:  StoredProcedure [dbo].[ExportToRequestTranscript]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ExportToRequestTranscript] 
	 (@FromDate nvarchar(126)
	 ,@ToDate nvarchar(126)
	 ,@Search nvarchar(126)
     ,@Sort nvarchar(126)
     ,@Total int output)
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
    --Sp_help RequestTranscript

   
	
	SET @Query = 'SELECT 
					 RT.FullName
					,RT.FormerName
					,RT.PhoneNo
					,RT.Email
					,RT.SSN
					,RT.DOB
					,RT.ProgramAttended
					,RT.PreviousAttended
					,RT.Address
					,RT.City
					,RT.State
					,RT.ZipCode
					,RT.TranscriptRequest
					,RT.InsertedBy
					,RT.InsertedDate
					,RT.UpdatedBy
					,RT.UpdatedDate

				FROM RequestTranscript RT
		        WHERE RT.RequestTranscriptId <> 0 '

	
		IF(@Search <> '')
			BEGIN
				--SET @Query = @Query + ' AND  RT.FullName LIKE ''%' + @Search + '%'''
				SET @Query = @Query + ' AND (RT.FullName LIKE ''%' + @Search + '%'' OR RT.FormerName LIKE ''%' + @Search + '%'' OR RT.Email LIKE ''%' + @Search + '%'')'    
			END

	



		IF(@FromDate <> '' OR @ToDate <> '')
		BEGIN
			IF(@FromDate <> '' AND @ToDate <> '')
				BEGIN
				Set @Query = @Query + ' AND Convert(Date, RT.InsertedDate) Between CONVERT(date,'''+@FromDate+''',103) AND CONVERT(date,'''+@ToDate+''',103)'

					--SET @Query = @Query + ' AND  (Convert(Date, RT.InsertedDate) >= ''' + @FromDate + ''' AND Convert(Date, RT.InsertedDate) <= ''' + @ToDate + ''')'
				END 

			IF(@FromDate <> '' AND @ToDate = '')
				BEGIN
					SET @Query = @Query + ' AND CONVERT(date,  RT.InsertedDate) >= CONVERT(date,'''+@FromDate+''',103)'

					--SET @Query = @Query + ' AND  Convert(Date,RT.InsertedDate) >= ''' + @FromDate + ''''
				END 
			IF(@FromDate = '' AND @ToDate <> '')
				BEGIN
					SET @Query = @Query + ' AND CONVERT(date,  RT.InsertedDate) <= CONVERT(date,'''+@ToDate+''',103)' 

					--SET @Query = @Query + ' AND Convert(Date, AN.InsertedDate) <= ''' + @ToDate + ''''
				END
	    END 

		IF(@Sort <> '')
			BEGIN
				SET @Query = @Query + ' ORDER BY ' + @Sort
			END
	
		EXEC sp_ExecuteSQL @Query;
		
	
		DROP TABLE #temp
 
END












GO
/****** Object:  StoredProcedure [dbo].[FEFinalHomePageInitialLoad]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
  
CREATE PROCEDURE [dbo].[FEFinalHomePageInitialLoad]      
   @ChapterId bigint      
  ,@QStatus int output      
  ,@Type nvarchar(256)      
           
AS      
BEGIN      
      
 -- SET NOCOUNT ON added to prevent extra result sets from      
       
 SET NOCOUNT ON;      
       
 BEGIN TRY       
       
    
      
  /*====================================================================*/      
  /*         President Message        */      
  /*====================================================================*/      
        
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('About Us In Home', '^a-z0-9')       
      
  /*====================================================================*/      
  /*         Welcome Message       */      
  /*====================================================================*/      
        
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('Services on Home Page', '^a-z0-9')       
      
      
  
    
        
  /*====================================================================*/      
  /*               Sponsors List                        */      
  /*====================================================================*/      
   SELECT  * FROM Sponsors  WHERE  IsActive=1      
   ORDER BY DisplayOrder asc      
      
  /*====================================================================*/      
  /*               SponsorCategories List                     */      
  /*====================================================================*/      
   
   
 If (@ChapterId=1)  
  begin     
            
             SELECT *,(SELECT COUNT(*) FROM Sponsors P WHERE P.SponsorCategoryId=PC.SponsorCategoryId AND IsActive=1 ) AS SponsorsCount       
                FROM SponsorCategories PC WHERE PC.CategoryName<>'Sponsors'   AND PC.IsActive = 1  And  PC.ChapterId =1   Order by PC.updatedtime DESC    
  end  
  else  
  begin  
  
   IF((Select Count(*) FROM SponsorCategories S WHERE S.IsActive = 1 And S.ChapterId = @ChapterId) <> 0)  
   BEGIN  
    SELECT *,(SELECT COUNT(*) FROM Sponsors P WHERE P.SponsorCategoryId=PC.SponsorCategoryId AND IsActive=1 ) AS SponsorsCount       
                   FROM SponsorCategories PC WHERE PC.CategoryName<>'Sponsors'   AND PC.IsActive = 1  And  PC.ChapterId =@ChapterId  Order by PC.updatedtime DESC    
   END  
   ELSE  
   begin     
     SELECT *,(SELECT COUNT(*) FROM Sponsors P WHERE P.SponsorCategoryId=PC.SponsorCategoryId AND IsActive=1 ) AS SponsorsCount       
                FROM SponsorCategories PC WHERE PC.CategoryName<>'Sponsors'   AND PC.IsActive = 1  And  PC.ChapterId =1   Order by PC.updatedtime DESC    
      
   end  
  end  
  
  
      
  /*====================================================================*/      
  /*               CommitteeCategories List                   */      
  /*====================================================================*/      
        
  SELECT * FROM CommitteeCategories WHERE IsActive=1 ORDER BY DisplayOrder ASC      
        
      
  
  
            
   /*============================================*/      
  /*    Menu Details         */      
  /*============================================*/      
  
  
  
  If (@ChapterId=1)  
  BEGIN      
    SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
    FROM MenuItems MI      
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
    Where MI.ChapterId = 1 AND MI.IsMenuBar=1 AND MI.IsActive = 1 Order By MI.Position      
   END      
  else  
  begin  
  
   IF((Select Count(*) FROM MenuItems MI WHERE MI.IsActive = 1 And MI.ChapterId = @ChapterId) <> 0)  
    BEGIN      
    SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
    FROM MenuItems MI      
    LEFT Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
    LEFT Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
    Where MI.ChapterId = @ChapterId AND MI.IsMenuBar=1 AND MI.IsActive = 1 Order By MI.Position      
   END      
   ELSE  
  BEGIN      
   SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
    FROM MenuItems MI      
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
    Where MI.ChapterId = 1 AND MI.IsMenuBar=1 AND MI.IsActive = 1 Order By MI.Position      
    END   
  end  
  
  
  --If (@ChapterId=1)      
  -- BEGIN      
  --  SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
  --  ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
  --  ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
  --  FROM MenuItems MI      
  --  Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
  --  Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
  --  Where MI.ChapterId = 1 AND MI.IsMenuBar=1 AND MI.IsActive = 1 Order By MI.Position      
  -- END      
  --ELSE      
  -- BEGIN      
  --  SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
  --  ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
  --  ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
  --  FROM MenuItems MI      
  --  LEFT Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
  --  LEFT Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
  --  Where MI.ChapterId = @ChapterId AND MI.IsMenuBar=1 AND MI.IsActive = 1 Order By MI.Position      
  -- END      
      
  /*============================================*/      
  /*   Footer Menu Details         */      
  /*============================================*/    
    
    
    
   
  
 If (@ChapterId=1)  
   BEGIN      
    SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
    ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName       
    ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)       
    ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))      
    ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))      
 
    ELSE '' END) END ) END ) END as ParentPageName      
    FROM MenuItems MI      
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
    Where MI.ChapterId = 1 AND MI.IsFooterBar=1 AND MI.IsActive = 1 Order By MI.Position      
         END      
  else  
  begin  
  
   IF((Select Count(*) FROM MenuItems MI WHERE MI.IsFooterBar = 1 And MI.ChapterId = @ChapterId) <> 0)  
    BEGIN      
    SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
    ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName       
    ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)       
    ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))      
    ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))      
 
    ELSE '' END) END ) END ) END as ParentPageName      
    FROM MenuItems MI      
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
    Where MI.ChapterId = @ChapterId AND MI.IsFooterBar=1 AND MI.IsActive = 1 Order By MI.Position     
   END      
   ELSE  
    BEGIN      
       SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
    ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName       
    ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)       
    ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))      
    ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))      
 
    ELSE '' END) END ) END ) END as ParentPageName      
    FROM MenuItems MI      
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
    Where MI.ChapterId = 1 AND MI.IsFooterBar=1 AND MI.IsActive = 1 Order By MI.Position      
     END    
  end  
  
  
  --IF (@ChapterId=1)      
  -- BEGIN      
  --  SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
  --  ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
  --  ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
  --  ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName       
  --  ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)       
  --  ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))      
  --  ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))    
   
  --  ELSE '' END) END ) END ) END as ParentPageName      
  --  FROM MenuItems MI      
  --  Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
  --  Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
  --  Where MI.ChapterId = 1 AND MI.IsFooterBar=1 AND MI.IsActive = 1 Order By MI.Position      
  --       END      
      
  --ELSE      
  --   BEGIN      
  --     SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
  --  ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
  --  ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
  --  ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName       
  --  ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)       
  --  ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))      
  --  ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))    
   
  --  ELSE '' END) END ) END ) END as ParentPageName      
  --  FROM MenuItems MI      
  --  Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
  --  Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
  --  Where MI.ChapterId = @ChapterId AND MI.IsFooterBar=1 AND MI.IsActive = 1 Order By MI.Position      
  --   END      
      
          
   /*====================================================================*/      
  /*         App Info       */      
  /*====================================================================*/      
      
  Select * From AppInfo where TollFreeNumber = @Type      
      
  /*============================================*/      
  /*              InnerPages Details     */      
  /*============================================*/      
        
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('Nats whatsapp in Home Page', '^a-z0-9')       
      
       
  /*============================================*/      
  /*   Quick Links Details         */      
  /*============================================*/      
       
           SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
    ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName       
    ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)       
    ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))      
    ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))      
 
    ELSE '' END) END ) END ) END as ParentPageName      
    FROM MenuItems MI      
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
    Where MI.ChapterId = @ChapterId AND MI.IsQuickLinks=1 AND MI.IsActive = 1 Order By MI.Position      
       
       
       
   /*====================================================================*/  
  /*         Chapters Info       */  
  /*====================================================================*/  
  
  SELECT  * FROM Chapters WHERE IsActive=1 ORDER BY ChapterName ASC  
     
  
  
     /*====================================================================*/      
  /*               Photo Gallery                              */      
  /*====================================================================*/      
      
  SELECT TOP(3) * FROM Photos P        
  --WHERE P.IsActive = 1 AND P.IsHome = 1      
  
  
  
      
  /*====================================================================*/      
  /*               Video Gallery                              */      
  /*====================================================================*/      
      
  SELECT TOP(3) * FROM Videos V        
  WHERE V.IsActive = 1 ORDER BY  V.UpdatedTime DESC      
  
   /*====================================================================*/      
  /*         Welcome Message       */      
  /*====================================================================*/      
        
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('Join Our Team on Home Page', '^a-z0-9')       
    
  
   /*====================================================================*/      
  /*         Welcome Message       */      
  /*====================================================================*/      
        
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('Years Of Experience on Home Page', '^a-z0-9')       
   
   /*====================================================================*/      
  /*         Welcome Message       */      
  /*====================================================================*/      
        
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('What Our Clients on Home Page', '^a-z0-9')       
 
  /*====================================================================*/      
  /*         Welcome Message       */      
  /*====================================================================*/      
        
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('Scorller Section on Home Page', '^a-z0-9')       

  
  
  SELECT @QStatus = 1;      
          
 END TRY      
          
    BEGIN CATCH        
       SELECT @QStatus = -1;      
    END CATCH       
END      
      
      
      
      
      
      


GO
/****** Object:  StoredProcedure [dbo].[FEFinalHomePageInitialLoadbkp202]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


create PROCEDURE [dbo].[FEFinalHomePageInitialLoadbkp202]    
   @ChapterId bigint    
  ,@QStatus int output    
  ,@Type nvarchar(256)    
         
AS    
BEGIN    
    
 -- SET NOCOUNT ON added to prevent extra result sets from    
     
 SET NOCOUNT ON;    
     
 BEGIN TRY     
     
  
    
  /*====================================================================*/    
  /*         President Message        */    
  /*====================================================================*/    
      
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('President Message In Home', '^a-z0-9')     
    
  /*====================================================================*/    
  /*         Welcome Message       */    
  /*====================================================================*/    
      
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('Welcome Message on Home Page', '^a-z0-9')     
    
    

  
      
  /*====================================================================*/    
  /*               Sponsors List                        */    
  /*====================================================================*/    
   SELECT  * FROM Sponsors  WHERE  IsActive=1    
   ORDER BY DisplayOrder asc    
    
  /*====================================================================*/    
  /*               SponsorCategories List                     */    
  /*====================================================================*/    
 
 
	If (@ChapterId=1)
		begin		 
			       
             SELECT *,(SELECT COUNT(*) FROM Sponsors P WHERE P.SponsorCategoryId=PC.SponsorCategoryId AND IsActive=1 ) AS SponsorsCount     
                FROM SponsorCategories PC WHERE PC.CategoryName<>'Sponsors'   AND PC.IsActive = 1  And  PC.ChapterId =1   Order by PC.updatedtime ASC  
		end
		else
		begin

			IF((Select Count(*) FROM SponsorCategories S WHERE S.IsActive = 1 And S.ChapterId = @ChapterId) <> 0)
			BEGIN
				SELECT *,(SELECT COUNT(*) FROM Sponsors P WHERE P.SponsorCategoryId=PC.SponsorCategoryId AND IsActive=1 ) AS SponsorsCount     
                   FROM SponsorCategories PC WHERE PC.CategoryName<>'Sponsors'   AND PC.IsActive = 1  And  PC.ChapterId =@ChapterId  Order by PC.updatedtime ASC  
			END
			ELSE
			begin		 
				 SELECT *,(SELECT COUNT(*) FROM Sponsors P WHERE P.SponsorCategoryId=PC.SponsorCategoryId AND IsActive=1 ) AS SponsorsCount     
                FROM SponsorCategories PC WHERE PC.CategoryName<>'Sponsors'   AND PC.IsActive = 1  And  PC.ChapterId =1   Order by PC.updatedtime ASC  
				
			end
		end


    
  /*====================================================================*/    
  /*               CommitteeCategories List                   */    
  /*====================================================================*/    
      
  SELECT * FROM CommitteeCategories WHERE IsActive=1 ORDER BY DisplayOrder ASC    
      
    


          
   /*============================================*/    
  /*    Menu Details         */    
  /*============================================*/    



  If (@ChapterId=1)
		BEGIN    
    SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl     
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive     
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount    
    FROM MenuItems MI    
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId    
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId    
    Where MI.ChapterId = 1 AND MI.IsMenuBar=1 AND MI.IsActive = 1 Order By MI.Position    
   END    
		else
		begin

			IF((Select Count(*) FROM MenuItems MI WHERE MI.IsActive = 1 And MI.ChapterId = @ChapterId) <> 0)
			 BEGIN    
    SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl     
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive     
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount    
    FROM MenuItems MI    
    LEFT Join MenuPages MP On MP.MenuItemId = MI.MenuItemId    
    LEFT Join PageDetails PD on PD.PageDetailId= MP.PageDetailId    
    Where MI.ChapterId = @ChapterId AND MI.IsMenuBar=1 AND MI.IsActive = 1 Order By MI.Position    
   END    
			ELSE
		BEGIN    
   SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl     
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive     
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount    
    FROM MenuItems MI    
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId    
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId    
    Where MI.ChapterId = 1 AND MI.IsMenuBar=1 AND MI.IsActive = 1 Order By MI.Position    
    END 
		end


  --If (@ChapterId=1)    
  -- BEGIN    
  --  SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl     
  --  ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive     
  --  ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount    
  --  FROM MenuItems MI    
  --  Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId    
  --  Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId    
  --  Where MI.ChapterId = 1 AND MI.IsMenuBar=1 AND MI.IsActive = 1 Order By MI.Position    
  -- END    
  --ELSE    
  -- BEGIN    
  --  SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl     
  --  ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive     
  --  ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount    
  --  FROM MenuItems MI    
  --  LEFT Join MenuPages MP On MP.MenuItemId = MI.MenuItemId    
  --  LEFT Join PageDetails PD on PD.PageDetailId= MP.PageDetailId    
  --  Where MI.ChapterId = @ChapterId AND MI.IsMenuBar=1 AND MI.IsActive = 1 Order By MI.Position    
  -- END    
    
  /*============================================*/    
  /*   Footer Menu Details         */    
  /*============================================*/  
  
  
  
 

 If (@ChapterId=1)
		 BEGIN    
    SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl     
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive     
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount    
    ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName     
    ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)     
    ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))    
    ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))     
    ELSE '' END) END ) END ) END as ParentPageName    
    FROM MenuItems MI    
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId    
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId    
    Where MI.ChapterId = 1 AND MI.IsFooterBar=1 AND MI.IsActive = 1 Order By MI.Position    
         END    
		else
		begin

			IF((Select Count(*) FROM MenuItems MI WHERE MI.IsFooterBar = 1 And MI.ChapterId = @ChapterId) <> 0)
			 BEGIN    
    SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl     
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive     
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount    
    ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName     
    ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)     
    ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))    
    ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))     
    ELSE '' END) END ) END ) END as ParentPageName    
    FROM MenuItems MI    
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId    
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId    
    Where MI.ChapterId = @ChapterId AND MI.IsFooterBar=1 AND MI.IsActive = 1 Order By MI.Position   
   END    
			ELSE
		  BEGIN    
       SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl     
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive     
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount    
    ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName     
    ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)     
    ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))    
    ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))     
    ELSE '' END) END ) END ) END as ParentPageName    
    FROM MenuItems MI    
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId    
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId    
    Where MI.ChapterId = @ChapterId AND MI.IsFooterBar=1 AND MI.IsActive = 1 Order By MI.Position    
     END  
		end






  --IF (@ChapterId=1)    
  -- BEGIN    
  --  SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl     
  --  ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive     
  --  ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount    
  --  ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName     
  --  ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)     
  --  ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))    
  --  ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))     
  --  ELSE '' END) END ) END ) END as ParentPageName    
  --  FROM MenuItems MI    
  --  Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId    
  --  Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId    
  --  Where MI.ChapterId = 1 AND MI.IsFooterBar=1 AND MI.IsActive = 1 Order By MI.Position    
  --       END    
    
  --ELSE    
  --   BEGIN    
  --     SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl     
  --  ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive     
  --  ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount    
  --  ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName     
  --  ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)     
  --  ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))    
  --  ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))     
  --  ELSE '' END) END ) END ) END as ParentPageName    
  --  FROM MenuItems MI    
  --  Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId    
  --  Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId    
  --  Where MI.ChapterId = @ChapterId AND MI.IsFooterBar=1 AND MI.IsActive = 1 Order By MI.Position    
  --   END    
    
        
   /*====================================================================*/    
  /*         App Info       */    
  /*====================================================================*/    
    
  Select * From AppInfo where TollFreeNumber = @Type    
    
  /*============================================*/    
  /*              InnerPages Details     */    
  /*============================================*/    
      
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('Nats whatsapp in Home Page', '^a-z0-9')     
    
     
  /*============================================*/    
  /*   Quick Links Details         */    
  /*============================================*/    
     
           SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl     
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive     
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount    
    ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName     
    ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)     
    ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))    
    ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))     
    ELSE '' END) END ) END ) END as ParentPageName    
    FROM MenuItems MI    
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId    
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId    
    Where MI.ChapterId = @ChapterId AND MI.IsQuickLinks=1 AND MI.IsActive = 1 Order By MI.Position    
     
     
     
	  /*====================================================================*/
		/*								 Chapters Info					  */
		/*====================================================================*/

		SELECT  * FROM Chapters WHERE IsActive=1 ORDER BY ChapterName ASC
		 


		   /*====================================================================*/    
  /*               Photo Gallery                              */    
  /*====================================================================*/    
    
  SELECT TOP(3) * FROM Photos P      
  --WHERE P.IsActive = 1 AND P.IsHome = 1    



    
  /*====================================================================*/    
  /*               Video Gallery                              */    
  /*====================================================================*/    
    
  SELECT TOP(3) * FROM Videos V      
  WHERE V.IsActive = 1 ORDER BY  V.UpdatedTime DESC    







  SELECT @QStatus = 1;    
        
 END TRY    
        
    BEGIN CATCH      
       SELECT @QStatus = -1;    
    END CATCH     
END    
    
    
    
    
    
    



GO
/****** Object:  StoredProcedure [dbo].[FEGetListMainLayout]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
  
  
CREATE PROCEDURE [dbo].[FEGetListMainLayout]  
  (@Email nvarchar(128),  
  @ChapterId bigint,  
  @QStatus int output,  
  @Type nvarchar(256))  
       
AS  
BEGIN  
  
 -- SET NOCOUNT ON added to prevent extra result sets from  
 -- interfering with SELECT statements.  
   
 SET NOCOUNT ON;  
 DECLARE @Query NVARCHAR(max);  
   
 BEGIN TRY   
  
     
  
  /*====================================================================*/  
  /*         News List         */  
  /*====================================================================*/  
  
  --If (@ChapterId= 1)  
  --begin  
  -- SELECT N.*, C.ChapterName FROM News N  
  -- INNER Join Chapters C ON C.ChapterId = N.ChapterId   
  -- WHERE N.IsActive= 1 AND N.UpdatedBy <> 'Blog' ORDER BY N.PostDate DESC  
  --end   
  --else  
  --begin  
  --SELECT N.*, C.ChapterName FROM News N   
  --  INNER Join Chapters C ON C.ChapterId = N.ChapterId   
  --  WHERE N.IsActive=1 AND N.ChapterId = @ChapterId AND N.UpdatedBy <> 'Blog' ORDER BY N.PostDate DESC    
  --end  
  ---select * from News where IsActive=1  
  
  
  IF (@ChapterId=1)  
    BEGIN  
    SELECT N.*, C.ChapterName FROM News N  
    LEFT Join Chapters C ON C.ChapterId = N.ChapterId   
    INNER Join ChapterNews CN ON CN.NewsId = N.NewsId   
    WHERE N.IsActive= 1 AND CN.ChapterId = 1 ORDER BY N.PostDate ASC  
  
            
   END   
  ELSE  
   BEGIN     
    IF((Select Count(*) FROM ChapterNews WHERE  ChapterId = @ChapterId) <> 0)  
       BEGIN  
    SELECT N.*, C.ChapterName FROM News N   
    LEFT Join Chapters C ON C.ChapterId = N.ChapterId   
    INNER Join ChapterNews CN ON CN.NewsId = N.NewsId   
    WHERE N.IsActive=1 AND CN.ChapterId = @ChapterId  ORDER BY N.PostDate ASC   
   END  
  
    ELSE  
      BEGIN  
    SELECT N.*, C.ChapterName FROM News N  
    LEFT Join Chapters C ON C.ChapterId = N.ChapterId   
    INNER Join ChapterNews CN ON CN.NewsId = N.NewsId   
    WHERE N.IsActive= 1 AND CN.ChapterId = 1 ORDER BY N.PostDate ASC  
  
            
   END   
   END  
  
  
  /*============================================*/  
  /*              Sponsors Details     */  
  /*============================================*/  
    
  --SELECT Top(3) * FROM Sponsors S   
  --INNER JOIN SponsorCategories SC on SC.SponsorCategoryId = S.SponsorCategoryId   
  --WHERE S.IsActive = 1  and  SC.CategoryName ='InnerSponsors'  
  --ORDER BY  SC.SponsorCategoryId ASC  
  
    SELECT   * FROM Sponsors  WHERE  IsActive=1  
   ORDER BY InsertedTime DESC  
  
  
  /*============================================*/    
  /*         Sponsors Commitee Categries      */    
  /*============================================*/  
   
  
If (@ChapterId=1)  
  begin     
            
             SELECT *,(SELECT COUNT(*) FROM Sponsors P WHERE P.SponsorCategoryId=PC.SponsorCategoryId AND IsActive=1 ) AS SponsorsCount       
                FROM SponsorCategories PC WHERE PC.CategoryName<>'Sponsors'   AND PC.IsActive = 1  And  PC.ChapterId =1   Order by PC.updatedtime ASC    
  end  
  else  
  begin  
  
   IF((Select Count(*) FROM SponsorCategories S WHERE S.IsActive = 1 And S.ChapterId = @ChapterId) <> 0)  
   BEGIN  
    SELECT *,(SELECT COUNT(*) FROM Sponsors P WHERE P.SponsorCategoryId=PC.SponsorCategoryId AND IsActive=1 ) AS SponsorsCount       
                   FROM SponsorCategories PC WHERE PC.CategoryName<>'Sponsors'   AND PC.IsActive = 1  And  PC.ChapterId =@ChapterId  Order by PC.updatedtime ASC    
   END  
   ELSE  
   begin     
     SELECT *,(SELECT COUNT(*) FROM Sponsors P WHERE P.SponsorCategoryId=PC.SponsorCategoryId AND IsActive=1 ) AS SponsorsCount       
                FROM SponsorCategories PC WHERE PC.CategoryName<>'Sponsors'   AND PC.IsActive = 1  And  PC.ChapterId =1   Order by PC.updatedtime ASC    
      
   end  
  end  
  
  
  
  --  SELECT *,(SELECT COUNT(*) FROM Sponsors P WHERE P.SponsorCategoryId=PC.SponsorCategoryId AND IsActive=1 ) AS SponsorsCount       
  --FROM SponsorCategories PC WHERE PC.CategoryName<>'Sponsors'   AND PC.IsActive = 1   Order by PC.updatedtime ASC    
      
    
  --SELECT *, (Select Count(*) from Sponsors S Where S.SponsorCategoryId = SS.SponsorCategoryId) As SponsorsCount FROM SponsorCategories SS ORDER BY UpdatedTime ASC  
  
     /*====================================================================*/  
  /*         App Info       */  
  /*====================================================================*/  
  
  Select * From AppInfo where TollFreeNumber = @Type  
  
    /*============================================*/  
  /*    Menu Details         */  
  /*============================================*/  
   If (@ChapterId=1)  
  BEGIN      
    SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
    FROM MenuItems MI      
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
    Where MI.ChapterId = 1 AND MI.IsMenuBar=1 AND MI.IsActive = 1 Order By MI.Position      
   END      
  else  
  begin  
  
   IF((Select Count(*) FROM MenuItems MI WHERE MI.IsActive = 1 And MI.ChapterId = @ChapterId) <> 0)  
    BEGIN      
    SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
    FROM MenuItems MI      
    LEFT Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
    LEFT Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
    Where MI.ChapterId = @ChapterId AND MI.IsMenuBar=1 AND MI.IsActive = 1 Order By MI.Position      
   END      
   ELSE  
  BEGIN      
   SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
    FROM MenuItems MI      
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
    Where MI.ChapterId = 1 AND MI.IsMenuBar=1 AND MI.IsActive = 1 Order By MI.Position      
    END   
  end  
  /*============================================*/  
  /*   Footer Menu Details         */  
  /*============================================*/  
  
  If (@ChapterId=1)  
   BEGIN      
    SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
    ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName       
    ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)       
    ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))      
    ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))      
 
    ELSE '' END) END ) END ) END as ParentPageName      
    FROM MenuItems MI      
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
    Where MI.ChapterId = 1 AND MI.IsFooterBar=1 AND MI.IsActive = 1 Order By MI.Position      
         END      
  else  
  begin  
  
   IF((Select Count(*) FROM MenuItems MI WHERE MI.IsFooterBar = 1 And MI.ChapterId = @ChapterId) <> 0)  
    BEGIN      
    SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
    ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName       
    ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)       
    ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))      
    ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))      
 
    ELSE '' END) END ) END ) END as ParentPageName      
    FROM MenuItems MI      
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
    Where MI.ChapterId = @ChapterId AND MI.IsFooterBar=1 AND MI.IsActive = 1 Order By MI.Position     
   END      
   ELSE  
    BEGIN      
       SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
    ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName       
    ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)       
    ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))      
    ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))      
 
    ELSE '' END) END ) END ) END as ParentPageName      
    FROM MenuItems MI      
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
    Where MI.ChapterId = @ChapterId AND MI.IsFooterBar=1 AND MI.IsActive = 1 Order By MI.Position      
     END    
  end  
  
  /*============================================*/  
  /*              InnerPages Details     */  
  /*============================================*/  
     
        SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('President Message in HomePage', '^a-z0-9')   
  /*====================================================================*/  
  /*         Events Section        */  
  /*====================================================================*/  
  
  SELECT TOP(2) A.StartDate ,A.EndDate, * FROM Events E  
  LEFT Join (Select EventId, StartDate, EndDate, ROW_NUMBER() OVER(Partition By EventId ORDER BY StartDate ASC) AS RowNo From EventDates  
  Where Convert(Date, EndDate) >= Convert(Date, GetDate())) A on A.RowNo = 1 AND A.EventId = E.EventId  
  WHERE (CONVERT (DATE,A.StartDate)  >= CONVERT (DATE,GETDATE()) OR A.StartDate IS NULL OR CONVERT (DATE, A.StartDate)  <=  CONVERT (DATE, GETDATE()) OR A.StartDate IS NULL OR A.EndDate IS NULL) AND A.EndDate >= CONVERT (DATE, GETDATE()) ORDER BY  A.StartDate DESC   
  
   /*============================================*/  
  /*              InnerPages Details     */  
  /*============================================*/  
    
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('ChapterNewsInnerPage', '^a-z0-9')   
     
  
  /*============================================*/  
  /*              InnerPages Details     */  
  /*============================================*/  
    
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('AksharaDepika', '^a-z0-9')   
     
  
  
 --/*============================================*/  
 -- /*              Sponsors Details     */  
 -- /*============================================*/  
    
 -- SELECT Top(3) * FROM Sponsors S   
 -- INNER JOIN SponsorCategories SC on SC.SponsorCategoryId = S.SponsorCategoryId   
 -- WHERE S.IsActive = 1  and  SC.CategoryName ='InnerSponsors'  
 -- ORDER BY  SC.SponsorCategoryId ASC  
  
  
  
   
  /*============================================*/  
  /*              Sponsors Details     */  
  /*============================================*/  
    
  SELECT Top(2) * FROM Sponsors S   
  INNER JOIN SponsorCategories SC on SC.SponsorCategoryId = S.SponsorCategoryId   
  WHERE S.IsActive = 1
 and  SC.CategoryName ='InnerMedia'   
    --WHERE S.IsActive = 1  and  SC.CategoryName =SC.CategoryName 
  ORDER BY  SC.SponsorCategoryId ASC  

  
  /*============================================*/    
  /*         Chapter        */    
  /*============================================*/  
    
  SELECT  * FROM Chapters WHERE IsActive=1 ORDER BY ChapterName ASC  
  
  
  
  
  
   /*============================================*/      
  /*   Quick Links Details         */      
  /*============================================*/      
       
           SELECT MI.MenuItemId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position, PD.PageDetailId,PD.Target, PD.Heading, PD.PageUrl, PD.DocumentUrl, PD.OtherUrl       
    ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = MI.PageParentId) AS ParentActive       
    ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.MenuItemId) AS SubMenuItemCount      
    ,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName       
    ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from MenuItems M2 where M2.MenuItemId=MI.PageParentId)       
    ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from MenuItems M3 where M3.MenuItemId=(SELECT M31.PageParentId from MenuItems M31 where M31.MenuItemId=MI.PageParentId))      
    ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from MenuItems M4 where M4.MenuItemId=(SELECT M41.PageParentId from MenuItems M41 where M41.MenuItemId=(SELECT M42.PageParentId from MenuItems M42 where M42.MenuItemId=MI.PageParentId)))      
 
    ELSE '' END) END ) END ) END as ParentPageName      
    FROM MenuItems MI      
    Inner Join MenuPages MP On MP.MenuItemId = MI.MenuItemId      
    Inner Join PageDetails PD on PD.PageDetailId= MP.PageDetailId      
    Where MI.ChapterId = @ChapterId AND MI.IsQuickLinks=1 AND MI.IsActive = 1 Order By MI.Position      
  
  
  
  
  
  
  
  
  
  
  
  
  
  SELECT @QStatus = 1;  
      
 END TRY  
      
    BEGIN CATCH    
       SELECT @QStatus = -1;  
    END CATCH   
END   
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  



GO
/****** Object:  StoredProcedure [dbo].[FEGetListMainLayout1]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[FEGetListMainLayout1]
	 (@Email nvarchar(128),
	 @QStatus int output)
     
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
	DECLARE @Query NVARCHAR(max);
	
	BEGIN TRY	

	  

		/*====================================================================*/
		/*								 News List							  */
		/*====================================================================*/
		
		SELECT * FROM News WHERE IsActive=1

		/*============================================*/
		/*              Sponsors Details			  */
		/*============================================*/
		
		SELECT Top(3) * FROM Sponsors S	
		INNER JOIN SponsorCategories SC on SC.SponsorCategoryId = S.SponsorCategoryId	
		WHERE S.IsActive = 1  and  SC.CategoryName ='InnerSponsors'
		ORDER BY  SC.SponsorCategoryId ASC


		/*============================================*/		
		/*         Sponsors Commitee Categries      */  
		/*============================================*/
		
		SELECT *, (Select Count(*) from Sponsors S Where S.SponsorCategoryId = SS.SponsorCategoryId) As SponsorsCount FROM SponsorCategories SS ORDER BY UpdatedTime ASC

	    /*====================================================================*/
		/*								 App Info					  */
		/*====================================================================*/

		Select * From AppInfo

		/*============================================*/
		/*				Menu Details			      */
		/*============================================*/
		
		SELECT MI.InnerPageCategoryId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position
		,(SELECT IsActive FROM InnerPageCategories WHERE InnerPageCategories.InnerPageCategoryId = MI.PageParentId) AS ParentActive 
		,(SELECT COUNT(*) FROM InnerPageCategories AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.InnerPageCategoryId) AS SubMenuItemCount
		FROM InnerPageCategories MI
		Where MI.IsMenuBar=1  AND MI.IsActive = 1 Order By MI.Position

		/*============================================*/
		/*			Footer	Menu Details			      */
		/*============================================*/
		
		SELECT MI.InnerPageCategoryId, MI.DisplayName, MI.IdPath, MI.PageParentId,MI.PageLevel, MI.Position
		,(SELECT IsActive FROM InnerPageCategories WHERE InnerPageCategories.InnerPageCategoryId = MI.PageParentId) AS ParentActive 
		,(SELECT COUNT(*) FROM InnerPageCategories AS CATCOUNT WHERE CATCOUNT.PageParentId = MI.InnerPageCategoryId) AS SubMenuItemCount
		,CASE WHEN MI.PageLevel=1 THEN MI.DisplayName 
		ELSE (CASE WHEN MI.PageLevel=2 THEN (SELECT M2.DisplayName from InnerPageCategories M2 where M2.InnerPageCategoryId=MI.PageParentId) 
		ELSE (CASE WHEN MI.PageLevel=3 THEN (SELECT M3.DisplayName from InnerPageCategories M3 where M3.InnerPageCategoryId=(SELECT M31.PageParentId from InnerPageCategories M31 where M31.InnerPageCategoryId=MI.PageParentId))
		ELSE (CASE WHEN MI.PageLevel=4 THEN (SELECT M4.DisplayName from InnerPageCategories M4 where M4.InnerPageCategoryId=(SELECT M41.PageParentId from InnerPageCategories M41 where M41.InnerPageCategoryId=(SELECT M42.PageParentId from InnerPageCategories M42 where M42.InnerPageCategoryId=MI.PageParentId))) 
		ELSE '' END) END ) END ) END as ParentPageName
		FROM InnerPageCategories MI
		Where MI.IsFooterBar=1 AND MI.IsActive = 1 Order By MI.Position	

		/*============================================*/
		/*              InnerPages Details			  */
		/*============================================*/
		
		SELECT * FROM InnerPages WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('President Message in HomePage', '^a-z0-9') 

		/*====================================================================*/
		/*								 Events Section						  */
		/*====================================================================*/

		SELECT * FROM Events


	    /*============================================*/
		/*              InnerPages Details			  */
		/*============================================*/
		
		SELECT * FROM InnerPages WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('ChapterNewsInnerPage', '^a-z0-9') 



		/*============================================*/
		/*              InnerPages Details			  */
		/*============================================*/
		
		SELECT * FROM InnerPages WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('AksharaDepika', '^a-z0-9') 

	
		/*============================================*/
		/*              Sponsors Details			  */
		/*============================================*/
		
		SELECT Top(3) * FROM Sponsors S	
		INNER JOIN SponsorCategories SC on SC.SponsorCategoryId = S.SponsorCategoryId	
		WHERE S.IsActive = 1  and  SC.CategoryName ='InnerMedia'
		ORDER BY  SC.SponsorCategoryId ASC


		SELECT @QStatus = 1;
				
	END TRY
    
    BEGIN CATCH  
       SELECT @QStatus = -1;
    END CATCH 
END 
























GO
/****** Object:  StoredProcedure [dbo].[FEGetListRightBlock]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[FEGetListRightBlock] 
	  @ChapterId bigint
	 ,@QStatus int output
     
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
	
	BEGIN TRY		
				    
		/*============================================*/		
		/*         Sponsors Gallery       */  
		/*============================================*/

		IF (@ChapterId=1)
			BEGIN
				SELECT * FROM Sponsors S	
				INNER JOIN SponsorCategories SC on SC.SponsorCategoryId = S.SponsorCategoryId	
				WHERE S.IsActive = 1  and  SC.CategoryName ='Sponsors'
				ORDER BY  SC.SponsorCategoryId ASC
			END
		ELSE
			BEGIN 
				SELECT * FROM Sponsors S	
				INNER JOIN SponsorCategories SC on SC.SponsorCategoryId = S.SponsorCategoryId	
				WHERE S.IsActive = 1  and  SC.CategoryName ='Sponsors'
				ORDER BY  SC.SponsorCategoryId ASC
			END 

		/*============================================*/
		/*           Media Sponsors Details			  */
		/*============================================*/

		IF (@ChapterId=1)
			BEGIN
				SELECT * FROM Sponsors S	
				INNER JOIN SponsorCategories SC on SC.SponsorCategoryId = S.SponsorCategoryId	
				WHERE S.IsActive = 1  and  SC.CategoryName ='media' 
				ORDER BY SC.SponsorCategoryId ASC
			END
		ELSE
			BEGIN
				SELECT * FROM Sponsors S	
				INNER JOIN SponsorCategories SC on SC.SponsorCategoryId = S.SponsorCategoryId	
				WHERE S.IsActive = 1  and  SC.CategoryName ='media'
				ORDER BY SC.SponsorCategoryId ASC
			END
		SELECT @QStatus = 1;
	END TRY
    
    BEGIN CATCH  
       SELECT @QStatus = -1;
    END CATCH 
END









GO
/****** Object:  StoredProcedure [dbo].[FEGetPromocodeValidate]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[FEGetPromocodeValidate]
     @PromoCode NVARCHAR(128)
    ,@QStatus int output    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	BEGIN TRY
	SET NOCOUNT ON;

		Select * From  PromoCodes P Where P.PromoCode = @PromoCode  AND Isactive=1 and Convert(date, P.StartDate) <= Convert(date, Getdate()) AND Convert(date, P.EndDate) >= Convert(date, Getdate()) 
		SELECT @QStatus = 1;
		
	 END TRY

	 BEGIN CATCH
		SELECT @QStatus = -1;
	 END CATCH
END 









GO
/****** Object:  StoredProcedure [dbo].[FEGetServicesDataById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[FEGetServicesDataById] 
	(@ServiceId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
   SET NOCOUNT ON;

    BEGIN TRY 
    
		 SELECT *, 
		 (Select ChapterName From Chapters Where ChapterId = S.ChapterId) as ChapterName
		 ,(Select  CategoryName from ServiceCategories where S.CategoryId=ServiceCategoryId) as CategoryName
		 ,(Select Top(1) ImageUrl from ServiceImages SI Where SI.ServiceId = S.ServiceId)  as ImageUrl
		 ,(Select sum(SD.Amount) from ServiceDonations SD Where SD.ServiceId = @ServiceId AND PaymentStatusId = 1)  as TotalAmount 
		 from Services S where S.ServiceId=@ServiceId


		 SELECT *FROM ServiceImages WHERE ServiceId = @ServiceId
		   
		 SELECT @QStatus = 1;
		 
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END









GO
/****** Object:  StoredProcedure [dbo].[FEGetVisionDetails]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[FEGetVisionDetails]
    @ChapterId bigint,
    @QStatus int output
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from

	SET NOCOUNT ON
    BEGIN TRY    
    
	 SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('Nats Mission in Home Page', '^a-z0-9') 

		SELECT @QStatus = 1;	
		
    END TRY
    BEGIN CATCH
    
		 SELECT @QStatus = -1;
		 
    END CATCH
    	
END

























GO
/****** Object:  StoredProcedure [dbo].[FEGetWebinarList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[FEGetWebinarList]
	(@ChapterId bigint
	 ,@QStatus int output)
      
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
	DECLARE @Query NVARCHAR(max);
	
	BEGIN TRY	 
		
		
		/*====================================================================*/
		/*				          Videos List                     			  */
		/*====================================================================*/
		
		SELECT *FROM Videos V		
		WHERE V.IsActive = 1 ORDER BY  V.UpdatedTime DESC	
		/*====================================================================*/
		/*				          Videos Categories List                  	  */
		/*====================================================================*/
		
		SELECT *,(SELECT COUNT(*) FROM Videos VC WHERE V.VideoCategoryId=VC.VideoCategoryId AND VC.IsActive=1) AS VideosCount FROM VideoCategories V 		
		where V.ChapterId=4 and V.ChapterId=@ChapterId ORDER BY  V.Year DESC		

		SELECT @QStatus = 1;
				
	END TRY
    
    BEGIN CATCH  
       SELECT @QStatus = -1;
    END CATCH 
END











GO
/****** Object:  StoredProcedure [dbo].[FEGetWebsiteBannersList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[FEGetWebsiteBannersList]
    @ChapterId bigint,
    @QStatus int output
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
    
		IF (@ChapterId=1)
			BEGIN
				SELECT * FROM WebsiteBanners WHERE IsActive=1 AND ChapterId = 1 ORDER BY OrderNo DESC
			END
		ELSE
			BEGIN			
				IF((Select Count(*) FROM WebsiteBanners WHERE IsActive=1 AND ChapterId = @ChapterId) <> 0)
					BEGIN
						--SELECT * FROM WebsiteBanners WHERE IsActive=1 AND ChapterId = @ChapterId ORDER BY OrderNo DESC 

						 
							  SELECT W.WebsiteBannerId,W.BannerTitle,W.BannerUrl,W.RedirectUrl,W.UpdatedTime, W.Target FROM WebsiteBanners W      
							  WHERE W.IsActive = 1 AND  W.ChapterId = @ChapterId  ORDER BY  W.UpdatedTime DESC   



					END
				ELSE
					BEGIN
						--SELECT * FROM WebsiteBanners WHERE IsActive=1 AND ChapterId = 1 ORDER BY OrderNo DESC

								  SELECT W.WebsiteBannerId,W.BannerTitle,W.BannerUrl,W.RedirectUrl,W.UpdatedTime, W.Target FROM WebsiteBanners W      
							  WHERE W.IsActive = 1 AND  W.ChapterId =  1 ORDER BY  W.UpdatedTime DESC   

					END	
			END

		SELECT @QStatus = 1;	
		
    END TRY
    BEGIN CATCH
    
		 SELECT @QStatus = -1;
		 
    END CATCH
    	
END



















GO
/****** Object:  StoredProcedure [dbo].[FEInsertLogReport]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO




CREATE PROCEDURE [dbo].[FEInsertLogReport]
    (@QStatus int output
	,@XMLLogCounts nvarchar(max))  
        
AS
BEGIN

	SET NOCOUNT ON;


	declare @LogReportCount int

	
	set @LogReportCount =(select Count(*) from LogReport)

	
	


    BEGIN TRY
    BEGIN TRANSACTION
    
		IF(@XMLLogCounts<>'')
		BEGIN
			DECLARE @XML1 AS XML	        
				SELECT @XML1 = @XMLLogCounts

				CREATE TABLE #temp1(Rid INT PRIMARY KEY IDENTITY(1,1),
					LogTitle nvarchar(max),
					LogDescription nvarchar(max),			
					InsertedBy nvarchar(max))
				
				DECLARE @RowCount1 AS int
				DECLARE @CurrentRow1 AS int	
				
				INSERT INTO #temp1(LogTitle,LogDescription,InsertedBy)
					select 
					M.Item.value('LogTitle[1]','nvarchar(max)'),
					M.Item.value('LogDescription[1]','nvarchar(max)'),			
					M.Item.value('InsertedBy[1]','nvarchar(max)')
					FROM @XML1.nodes('/ArrayOfLogReport/LogReport') AS M(Item)
					
				SET @RowCount1 = @@ROWCOUNT	
				SELECT @RowCount1
				SET @CurrentRow1 = 1
				WHILE @CurrentRow1 < @RowCount1 + 1

				BEGIN	
				if(@LogReportCount>5000)
	             begin

				WITH CTE AS (
				SELECT TOP (1) *
				FROM LogReport
				ORDER BY LogId ASC
				)
				DELETE FROM CTE;

			End
			
						INSERT INTO LogReport SELECT							
									T.LogTitle,
									T.LogDescription,
									GETUTCDATE(),
									T.InsertedBy,
									GETUTCDATE(),
									T.InsertedBy,
									GETUTCDATE()
									FROM #temp1 T WHERE T.Rid = @CurrentRow1 	
						
					SELECT @QStatus = 1;
					SET @CurrentRow1 = @CurrentRow1 + 1
				END	

				DROP TABLE #temp1
		END
	COMMIT TRANSACTION   
    END TRY
    
    BEGIN CATCH 
		ROLLBACK TRANSACTION     
		SELECT @QStatus = -1;    
    END CATCH   
    
END









































GO
/****** Object:  StoredProcedure [dbo].[FENewHomePageInitialLoad]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
  
CREATE PROCEDURE [dbo].[FENewHomePageInitialLoad]      
   @QStatus int output  
  ,@Type nvarchar(256)       
           
AS      
BEGIN      
      
 -- SET NOCOUNT ON added to prevent extra result sets from      
       
 SET NOCOUNT ON;      
       
 BEGIN TRY       
       
      /*====================================================================*/      
  /*         App Info       */      
  /*====================================================================*/      
      
  Select TollFreeNumber,* From AppInfo where TollFreeNumber = @Type      
      
  /*============================================*/      
  /*              About Section in HomePage     */      
  /*============================================*/      
        
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('About Section in HomePage', '^a-z0-9')       
      
      
  /*====================================================================*/      
  /*         Next step Section in HomePage       */      
  /*====================================================================*/      
        
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('Next step Section in HomePage', '^a-z0-9')       
      
  /*====================================================================*/      
  /*         Academic Program Section in HomePage       */      
  /*====================================================================*/      
        
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('Academic Program Section in HomePage', '^a-z0-9')       
      
    
  
   /*====================================================================*/      
  /*         Why Orion Tech Section in HomePage       */      
  /*====================================================================*/      
        
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('Why Orion Tech Section in HomePage', '^a-z0-9')       
    
  
   /*====================================================================*/      
  /*         Numbers Section in Home Page       */      
  /*====================================================================*/      
        
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('Numbers Section in Home Page', '^a-z0-9')       
   
   /*====================================================================*/      
  /*         Accreditations Section in Homepage       */      
  /*====================================================================*/      
        
  SELECT * FROM PageDetails WHERE IsActive=1 AND dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar('Accreditations Section in Homepage', '^a-z0-9')       
 
 
  
  
  SELECT @QStatus = 1;      
          
 END TRY      
          
    BEGIN CATCH        
       SELECT @QStatus = -1;      
    END CATCH       
END      
      
      
      
      
      
      

GO
/****** Object:  StoredProcedure [dbo].[FEServiceCategoriesGetListByChapterId]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

Create PROCEDURE [dbo].[FEServiceCategoriesGetListByChapterId]
	(@ChapterId bigint
	,@QStatus int output)    
        
AS
BEGIN
	
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	
	SET NOCOUNT ON;
	
	BEGIN TRY
	
		SELECT * FROM ServiceCategories WHERE IsActive = 1 AND ChapterId = @ChapterId 
		SELECT @QStatus = 1;
	END TRY
    
    BEGIN CATCH  
       SELECT @QStatus = -1;   
    END CATCH 	 
END











GO
/****** Object:  StoredProcedure [dbo].[FEServicesGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[FEServicesGetById] 
	(@ServiceId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	
   SET NOCOUNT ON;

    -- Insert statements for procedure here

    BEGIN TRY 
    
		 SELECT *, 
		 (Select ChapterName From Chapters Where ChapterId = S.ChapterId) as ChapterName
		 ,(Select  CategoryName from ServiceCategories where S.CategoryId=ServiceCategoryId) as CategoryName
		 ,(Select Top(1) ImageUrl from ServiceImages SI Where SI.ServiceId = S.ServiceId)  as ImageUrl
		,(Select sum(SD.Amount) from ServiceDonations SD Where SD.ServiceId = @ServiceId AND PaymentStatusId = 1)  as TotalAmount 
		  from Services S where S.ServiceId=@ServiceId


		  SELECT *FROM ServiceImages WHERE ServiceId = @ServiceId

		  SELECT * FROM ServiceDonations E 
		  Inner JOIN ServiceDonationInfo DI ON E.ServiceDonationId = DI.ServiceDonationId 
		  WHERE ServiceId = @ServiceId AND E.PaymentStatusId = 1
		 
		 SELECT @QStatus = 1;
		 
    END TRY
    
    BEGIN CATCH
    
		 SELECT @QStatus = -1;
		 
    END CATCH	
	 
END









GO
/****** Object:  StoredProcedure [dbo].[FEServicesGetListByChapterId]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[FEServicesGetListByChapterId]
	(@ChapterId bigint
	,@QStatus int output)    
        
AS
BEGIN
	
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	
	SET NOCOUNT ON;
	
	BEGIN TRY
	
	if((SELECT Count(*) FROM Services WHERE ChapterId = @ChapterId) <> 0)
	BEGIN
		SELECT * FROM Services WHERE ChapterId = @ChapterId AND IsDisplay = 1 
	END

	ELSE
	BEGIN
		SELECT * FROM Services WHERE IsDisplay = 1
	END

		SELECT @QStatus = 1;
	END TRY
    
    BEGIN CATCH  
       SELECT @QStatus = -1;   
    END CATCH 	 
END











GO
/****** Object:  StoredProcedure [dbo].[FEServicesGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[FEServicesGetListByVariable] 
	 (@ChapterId bigint
	 ,@CategoryId bigint
	 ,@ServiceType nvarchar(512)
	 ,@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output
	 ,@MemberId bigint)
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
	
	BEGIN TRY
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
	
    
    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
				,ServiceId bigint
				,ChapterId bigint
				,CategoryId bigint
				,ServiceTitle nvarchar(256)
				,ServiceType nvarchar(256)
				,OrganisedBy nvarchar(256)
				,Purpose nvarchar(1024) 
				,Description nvarchar(max) 
				,ShortDescription nvarchar(1024)
				,DocumentUrl nvarchar(1024)
				,ExpiryDate datetime 
				,EstimationAmount decimal(15,2) 
				,ServiceStatus nvarchar(1024)
				,IsDisplay bit
				,Field1 nvarchar(max) 
				,Field2 nvarchar(max) 
				,UpdatedDate datetime
				,UpdatedBy nvarchar(64)
				,ChapterName nvarchar(1024)
				,CategoryName nvarchar(1024)
				,ServiceTypeName nvarchar(1024)
				,ImageUrl nvarchar(1024)
				,TotalAmount decimal(15,2) )

				
	SELECT @Start = (@PageNo - 1) * @Items  
	   
	SELECT @End = @Start + @Items 
	
	SET @Query = 'INSERT INTO #temp 
		  SELECT  S.ServiceId 
				,S.ChapterId 
				,S.CategoryId 
				,S.ServiceTitle 
				,S.ServiceType 
				,S.OrganisedBy 
				,S.Purpose 
				,S.Description  
				,S.ShortDescription
				,S.DocumentUrl 
				,S.ExpiryDate  
				,S.EstimationAmount 
				,S.ServiceStatus 
				,S.IsDisplay 
				,S.Field1 
				,S.Field2 
				,S.UpdatedDate 
				,S.UpdatedBy
				,(''Nats Global'') As ChapterName
				,(''General'') As CategoryName
				,(Select  ServiceType from ServiceTypes where S.ServiceType=ServiceType) as ServiceTypeName
				,(Select Top(1) ImageUrl from ServiceImages SI Where SI.ServiceId = S.ServiceId)  as ImageUrl
				,(Select sum(SD.Amount) from ServiceDonations SD Where SD.ServiceId = S.ServiceId AND PaymentStatusId = 1)  as TotalAmount
				FROM Services S
				--Inner JOIN Chapters C  ON S.ChapterId = C.ChapterId
				--Inner JOIN ServiceCategories SC ON S.CategoryId = SC.ServiceCategoryId
				WHERE S.ServiceId <> 0 AND S.IsDisplay = 1'
		
		IF(@CategoryId<>0)
			BEGIN
				SET @Query=@Query + ' AND S.CategoryId = ' + CAST(@CategoryId as nvarchar(50))
			END

		IF(@ServiceType <> '')
			BEGIN
				SET @Query = @Query + ' AND  S.ServiceType LIKE ''%' + @ServiceType + '%'''
			END
		
		IF(@Search <> '')
			BEGIN
				SET @Query = @Query + ' AND  C.ChapterName LIKE ''%' + @Search + '%'' OR SC.CategoryName  LIKE ''%' + @Search + '%'' OR S.ServiceTitle LIKE ''%' + @Search + '%'' OR S.ServiceType  LIKE ''%' + @Search + '%'''
			END

		IF(@Sort <> '')
			BEGIN
				SET @Query = @Query + ' ORDER BY ' + @Sort
			END
	
		EXEC sp_ExecuteSQL @Query;
		print @Query;
		SELECT @Total = COUNT(Rid) from #temp 
				
		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
		DROP TABLE #temp

	END TRY
    
    BEGIN CATCH  
       SELECT @Total = -1; 		   
    END CATCH   
END








GO
/****** Object:  StoredProcedure [dbo].[FEServicesGetListByVariableByYear]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[FEServicesGetListByVariableByYear] 
	 (@ChapterId bigint
	 ,@CategoryId bigint
	 ,@ServiceType nvarchar(512)
	 ,@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output
	 ,@MemberId bigint
	 ,@Year nvarchar(512))
AS
BEGIN

	
	SET NOCOUNT ON;
	
	BEGIN TRY
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);

    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
				,ServiceId bigint
				,ChapterId bigint
				,CategoryId bigint
				,ServiceTitle nvarchar(256)
				,ServiceType nvarchar(256)
				,OrganisedBy nvarchar(256)
				,Purpose nvarchar(1024) 
				,Description nvarchar(max) 
				,ShortDescription nvarchar(1024)
				,DocumentUrl nvarchar(1024)
				,ExpiryDate datetime 
				,EstimationAmount decimal(15,2) 
				,ServiceStatus nvarchar(1024)
				,IsDisplay bit
				,Field1 nvarchar(max) 
				,Field2 nvarchar(max) 
				,UpdatedDate datetime
				,UpdatedBy nvarchar(64)
				,ChapterName nvarchar(1024)
				,CategoryName nvarchar(1024)
				,ServiceTypeName nvarchar(1024)
				,ImageUrl nvarchar(1024)
				,TotalAmount decimal(15,2) )

				
	SELECT @Start = (@PageNo - 1) * @Items  
	   
	SELECT @End = @Start + @Items 
	
	SET @Query = 'INSERT INTO #temp 
		  SELECT  S.ServiceId 
				,S.ChapterId 
				,S.CategoryId 
				,S.ServiceTitle 
				,S.ServiceType 
				,S.OrganisedBy 
				,S.Purpose 
				,S.Description  
				,S.ShortDescription
				,S.DocumentUrl 
				,S.ExpiryDate  
				,S.EstimationAmount 
				,S.ServiceStatus 
				,S.IsDisplay 
				,S.Field1 
				,S.Field2 
				,S.UpdatedDate 
				,S.UpdatedBy
				,(''NATS Global'') As ChapterName
				,SC.CategoryName 
				,(Select  ServiceType from ServiceTypes where S.ServiceType=ServiceType) as ServiceTypeName
				,(Select Top(1) ImageUrl from ServiceImages SI Where SI.ServiceId = S.ServiceId)  as ImageUrl '
				IF(@Year <> '')
					BEGIN
						SET @Query=@Query + ' ,(Select sum(SD.Amount) from ServiceDonations SD Where SD.ServiceId = S.ServiceId AND SD.PaymentStatusId = 1 AND Year(SD.OrderDate) = ' + CAST(@Year as nvarchar(50))+')  as TotalAmount '
					END
				ELSE
					BEGIN
						SET @Query=@Query + ' ,(Select sum(SD.Amount) from ServiceDonations SD Where SD.ServiceId = S.ServiceId AND SD.PaymentStatusId = 1)  as TotalAmount '
					END
		SET @Query=@Query + ' FROM Services S	
		Inner JOIN ServiceCategories SC ON S.CategoryId = SC.ServiceCategoryId
		WHERE S.ServiceId <> 0 AND S.ServiceId <> 10 AND S.ServiceId <> 14'
		
		
		IF(@Year <> '')
			BEGIN
				SET @Query=@Query + ' AND S.ServiceId in (Select SD.ServiceId from ServiceDonations SD Where SD.ServiceId <> 10 AND SD.PaymentStatusId = 1 AND Year(SD.OrderDate) = ' + CAST(@Year as nvarchar(50))+')'
			END
		
		IF(@ServiceType <> '')
			BEGIN
				SET @Query = @Query + ' AND  S.ServiceType LIKE ''%' + @ServiceType + '%'''
			END
		
		IF(@Search <> '')
			BEGIN
				SET @Query = @Query + ' AND  C.ChapterName LIKE ''%' + @Search + '%'' OR SC.CategoryName  LIKE ''%' + @Search + '%'' OR S.ServiceTitle LIKE ''%' + @Search + '%'' OR S.ServiceType  LIKE ''%' + @Search + '%'''
			END

	
	
		IF(@Sort <> '')
		BEGIN
			SET @Query = @Query + ' ORDER BY ' + @Sort
		END
	
		EXEC sp_ExecuteSQL @Query;
		print @Query;
		SELECT @Total = COUNT(Rid) from #temp 
				
		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
		DROP TABLE #temp

	END TRY
    
    BEGIN CATCH  
       SELECT @Total = -1; 		   
    END CATCH   
END








GO
/****** Object:  StoredProcedure [dbo].[FEServicesGetTotalAmount]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[FEServicesGetTotalAmount] 
	(@ChapterId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
   SET NOCOUNT ON;

    BEGIN TRY 
 
	IF(@ChapterId = 1)
		BEGIN
		Select 
			 (Select sum(SD.Amount) from ServiceDonations SD Where Year(SD.OrderDate) = (Year(GetDate())) AND PaymentStatusId = 1  AND SD.ServiceId <> 10 AND SD.ServiceId <> 14) as YearTotalAmount ,
			 (Select sum(SD.Amount) from ServiceDonations SD Where PaymentStatusId = 1 AND SD.ServiceId <> 10 AND SD.ServiceId <> 14) as TotalAmount 
		   
		END 
	ELSE
		BEGIN
			 Select 
			 (Select sum(SD.Amount) from ServiceDonations SD Where Year(SD.OrderDate) = (Year(GetDate())) AND PaymentStatusId = 1 AND SD.ServiceId = S.ServiceId AND SD.ServiceId <> 10 AND SD.ServiceId <> 14) as YearTotalAmount ,
			 (Select sum(SD.Amount) from ServiceDonations SD Where PaymentStatusId = 1  AND SD.ServiceId = S.ServiceId AND SD.ServiceId <> 10 AND SD.ServiceId <> 14) as TotalAmount 
			 from Services S Where ChapterId = @ChapterId
		END

		SELECT Distinct Top(2) C.MemberId
						,(C.FirstName + ' ' + C.LastName) As Name
						,C.MobilePhone
						,C.Address
						,C.City
						,C.State
						,C.Email
						,C.ProfileImage
						,CM.DisplayOrder
						,C.IsApproved
						,C.Occupation
						,CC.UpdatedBy
						,CC.UpdatedTime
						,CC.CategoryName
						,CC.CommitteeCategoryId
						,CC.Type	
						,CM.Designation			
						,CC.* FROM  Members C
						INNER JOIN CommitteeMembers CM ON CM.MemberId = C.MemberId
						INNER JOIN CommitteeCategories CC ON CC.CommitteeCategoryId= CM.CommitteeCategoryId
						INNER JOIN ChapterCommittees CO ON CO.CommitteeCategoryId= CM.CommitteeCategoryId
						WHERE dbo.RemoveSpecialChar(CC.CategoryName, '^a-z0-9') = dbo.RemoveSpecialChar('NATS Helpline', '^a-z0-9') AND CC.IsActive=1 
						AND CM.ChapterId = 1 AND (CM.Designation = 'President' OR CM.Designation = 'Chairman') ORDER BY CM.DisplayOrder ASC
 
				 SELECT @QStatus = 1;
		 
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END









GO
/****** Object:  StoredProcedure [dbo].[FETeluguAmmaiRegistrationsInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[FETeluguAmmaiRegistrationsInsert]
	(@TeluguAmmaiRegistrationId	bigint	output
	,@ChapterId	bigint	
	,@RegestrationID	nvarchar(512)	
	,@FirstName	nvarchar(512)	
	,@LastName	nvarchar(512)	
	,@EmailId	nvarchar(1024)	
	,@DOB	datetime	
	,@ParentFirstName	nvarchar(512)	
	,@ParentLastName	nvarchar(512)	
	,@ParentRelation	nvarchar(512)	
	,@ParentEmail	nvarchar(1024)	
	,@SchoolGrade	nvarchar(256)	
	,@Gender	nvarchar(125)	
	,@PrimaryPhoneNumber	nvarchar(125)	
	,@AlternativePhoneNumber	nvarchar(125)	
	,@Address1	nvarchar(MAX)	
	,@Address2	nvarchar(MAX)	
	,@City	nvarchar(256)	
	,@State	nvarchar(256)	
	,@ZipCode	nvarchar(125)	
	,@CompetitionCategory1	nvarchar(512)	
	,@CompetitionCategory2	nvarchar(512)	
	,@TotalAmount	decimal(15, 2)	
	,@IsActive	bit	
	,@TransactionId	nvarchar(128)	
	,@PaymentStatusId	bigint	
	,@PaymentMethodId	bigint	
	,@OrderDate	datetime	
	,@PaymentBy	nvarchar(2048)	
	,@InsertedBy	nvarchar(30)	
	,@InsertedDate	datetime	
	,@UpdatedBy	nvarchar(30)	
	,@UpdatedDate	datetime	
	,@QStatus int output
	,@EventId bigint
	,@RegistrationCategoryId bigint
	,@Age int
	,@MaritalStatu nvarchar(256)
	,@District nvarchar(256))  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;

    BEGIN TRY
    BEGIN TRANSACTION
			IF((SELECT COUNT(*) FROM TeluguAmmaiRegistrations WHERE TeluguAmmaiRegistrationId = @TeluguAmmaiRegistrationId) = 0)
					BEGIN
						INSERT INTO TeluguAmmaiRegistrations VALUES
							(@ChapterId		
							,@RegestrationID		
							,@FirstName		
							,@LastName	
							,@EmailId
							,@DOB		
							,@ParentFirstName	
							,@ParentLastName
							,@ParentRelation		
							,@ParentEmail
							,@SchoolGrade		
							,@Gender		
							,@PrimaryPhoneNumber
							,@AlternativePhoneNumber	
							,@Address1	
							,@Address2	
							,@City		
							,@State	
							,@ZipCode		
							,@CompetitionCategory1		
							,@CompetitionCategory2	
							,@TotalAmount	
							,@IsActive		
							,@TransactionId	
							,@PaymentStatusId		
							,@PaymentMethodId		
							,@OrderDate		
							,@PaymentBy	
							,@InsertedBy
							,@InsertedDate		
							,@UpdatedBy		
							,@UpdatedDate
							,@EventId
							,@RegistrationCategoryId
							,@Age
							,@MaritalStatu
							,@District)
						SET @TeluguAmmaiRegistrationId=SCOPE_IDENTITY()		
			
						SELECT @QStatus = 1;	
					END
			ELSE
				BEGIN
					UPDATE TeluguAmmaiRegistrations
					   SET ChapterId			=@ChapterId,		      
						RegestrationID			= @RegestrationID,		
						FirstName				= @FirstName,	
						LastName				= @LastName,	
						EmailId					= @EmailId,
						DOB						= @DOB,
						ParentFirstName			= @ParentFirstName,
						ParentLastName			= @ParentLastName,
						ParentRelation			= @ParentRelation,	
						ParentEmail				= @ParentEmail,
						SchoolGrade				= @SchoolGrade,	
						Gender					= @Gender,	
						PrimaryPhoneNumber		= @PrimaryPhoneNumber,
						AlternativePhoneNumber  = @AlternativePhoneNumber,
						Address1				= @Address1,
						Address2				= @Address2,
						City					= @City,	
						State					= @State,
						ZipCode				    = @ZipCode,		
						CompetitionCategory1	= @CompetitionCategory1,		
						CompetitionCategory2	= @CompetitionCategory2,	
						TotalAmount				= @TotalAmount,	
						IsActive				= @IsActive,		
						TransactionId			= @TransactionId,	
						PaymentStatusId			= @PaymentStatusId,		
						PaymentMethodId			= @PaymentMethodId,		
						OrderDate				= @OrderDate,		
						PaymentBy				= @PaymentBy,	
						InsertedBy				= @InsertedBy,
						InsertedDate			= @InsertedDate,		
						UpdatedBy				= @UpdatedBy,		
						UpdatedDate				= @UpdatedDate,
						EventId					= @EventId,
						RegistrationCategoryId  = RegistrationCategoryId,
						Age						= @Age,
						MaritalStatu			= @MaritalStatu,
						District				= @District
					 WHERE TeluguAmmaiRegistrationId = @TeluguAmmaiRegistrationId
		 		 
					 SELECT @QStatus = 2;	
				END
		
    COMMIT TRANSACTION
    END TRY
    
    BEGIN CATCH    
    ROLLBACK TRANSACTION
		SELECT @QStatus = -1;    
    END CATCH    
END













GO
/****** Object:  StoredProcedure [dbo].[GetChapters]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[GetChapters]
		   (@QStatus int output)  
         
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from

    SET NOCOUNT ON;

    BEGIN TRY 
       SELECT Top(1) * from Chapters Order By OrderNo DESC
	   SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	

END











GO
/****** Object:  StoredProcedure [dbo].[GetPaymentSettingsDetails]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[GetPaymentSettingsDetails]
    @QStatus int output
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY
		SELECT * FROM PaymentSettings	
		SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END












GO
/****** Object:  StoredProcedure [dbo].[GetStatesByCountryID]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[GetStatesByCountryID]  
	(@CountryID bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
	
   SET NOCOUNT ON;

    BEGIN TRY 
		Select * from  demo3db.States  where CountryId=@CountryID
		SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END












GO
/****** Object:  StoredProcedure [dbo].[InnerPageCategoriesDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[InnerPageCategoriesDelete]
    (@InnerPageCategoryId bigint
    ,@QStatus int OUTPUT)  
        
AS
BEGIN
	
	SET NOCOUNT ON;

    BEGIN TRY    
		DELETE FROM InnerPageCategories WHERE InnerPageCategoryId = @InnerPageCategoryId	    
		
		SELECT @QStatus = 1;
		
    END TRY
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END












GO
/****** Object:  StoredProcedure [dbo].[InnerPageCategoriesGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[InnerPageCategoriesGetById]
	(@InnerPageCategoryId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from

	
	SET NOCOUNT ON;


   BEGIN TRY 
		SELECT *, 
		(Select DisplayName From InnerPageCategories Where InnerPageCategoryId = M.PageParentId) as ParentName 
		,(Select C.ChapterName From Chapters C Where C.ChapterId = M.ChapterId) as ChapterName 
		FROM InnerPageCategories M WHERE InnerPageCategoryId = @InnerPageCategoryId
		  
	    SELECT @QStatus = 1;
		
    END TRY
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH		
	 
END













GO
/****** Object:  StoredProcedure [dbo].[InnerPageCategoriesGetByLevel]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[InnerPageCategoriesGetByLevel]
	(@PageLevel int
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
	
	SET NOCOUNT ON;

   BEGIN TRY 
		SELECT * FROM InnerPageCategories  WHERE PageLevel = @PageLevel
	    SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH		
	 
END












GO
/****** Object:  StoredProcedure [dbo].[InnerPageCategoriesGetByName]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[InnerPageCategoriesGetByName]
	(@DisplayName nvarchar(256)
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
	
	SET NOCOUNT ON;

   BEGIN TRY 
		SELECT * FROM InnerPageCategories  WHERE DisplayName = @DisplayName
	    SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH		
	 
END















GO
/****** Object:  StoredProcedure [dbo].[InnerPageCategoriesGetByParentId]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[InnerPageCategoriesGetByParentId]
	(@PageParentId int
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
	
	SET NOCOUNT ON;

   BEGIN TRY 
		SELECT * FROM InnerPageCategories  WHERE PageParentId = @PageParentId
		SELECT @QStatus = 1;
   END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH		
	 
END


















GO
/****** Object:  StoredProcedure [dbo].[InnerPageCategoriesGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[InnerPageCategoriesGetList]
	@QStatus int OUTPUT
        
AS
BEGIN
	BEGIN TRY

		DECLARE @Query nvarchar(max);
		DECLARE @Start int, @End INT ;
	    
		SET NOCOUNT ON;
		    
		SELECT InnerPageCategoryId
			  ,DisplayName  
			  ,PageLevel
			  ,PageParentId
			  ,IdPath 
			  ,IsFooterBar
			  ,IsMenuBar
			  ,IsTopBar
			  ,IsQuickLinks
			  ,Position
			  ,IsActive
			  ,UpdatedBy
			  ,UpdatedDate
			  ,InsertedBy
			  ,InsertedDate
			  ,(SELECT IsActive FROM InnerPageCategories WHERE InnerPageCategories.InnerPageCategoryId = c.PageParentId) AS ParentActive 
			  ,(SELECT COUNT(*) FROM InnerPageCategories AS CATCOUNT WHERE CATCOUNT.PageParentId = c.InnerPageCategoryId) AS SubMenuItemCount
			  ,(Select InnerPageId from InnerPages Where Heading =  c.DisplayName) AS InnerPageId
			  FROM InnerPageCategories c ORDER BY Position ASC

	    SELECT @QStatus = 1;		
	END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH  
    
END











GO
/****** Object:  StoredProcedure [dbo].[InnerPageCategoriesGetListByChapterId]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[InnerPageCategoriesGetListByChapterId]
    @ChapterId bigint,
	@QStatus int OUTPUT
        
AS
BEGIN

	BEGIN TRY
		DECLARE @Query nvarchar(max);
		DECLARE @Start int, @End INT ;
	    
		SET NOCOUNT ON;
		    
		SELECT InnerPageCategoryId
			  ,DisplayName  
			  ,PageLevel
			  ,PageParentId
			  ,IdPath 
			  ,IsFooterBar
			  ,IsMenuBar
			  ,IsTopBar
			  ,IsQuickLinks
			  ,Position
			  ,IsActive
			  ,UpdatedBy
			  ,UpdatedDate
			  ,InsertedBy
			  ,InsertedDate
			  ,(SELECT IsActive FROM InnerPageCategories WHERE InnerPageCategories.InnerPageCategoryId = c.PageParentId) AS ParentActive 
			  ,(SELECT COUNT(*) FROM InnerPageCategories AS CATCOUNT WHERE CATCOUNT.PageParentId = c.InnerPageCategoryId) AS SubMenuItemCount
			  ,(Select InnerPageId from InnerPages Where Heading =  c.DisplayName) AS InnerPageId
	    FROM InnerPageCategories c Where c.ChapterId = @ChapterId ORDER BY Position ASC


	    
	    SELECT @QStatus = 1;		
		
	END TRY
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH  
    
END











GO
/****** Object:  StoredProcedure [dbo].[InnerPageCategoriesInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[InnerPageCategoriesInsert]
    (@InnerPageCategoryId bigint
	,@ChapterId bigint
    ,@DisplayName nvarchar(256) 
	,@PageParentId bigint 
	,@IsTopBar bit
	,@IsMenuBar bit
	,@IsQuickLinks bit
	,@IsFooterBar bit
	,@Position int						
	,@IsActive bit
	,@UpdatedBy nvarchar(64)
	,@UpdatedDate datetime
	,@InsertedBy nvarchar(64)
	,@InsertedDate datetime
	,@QStatus int OUTPUT)  
        
AS
BEGIN
	SET NOCOUNT ON;
    BEGIN TRY
		
		DECLARE @IdPath nvarchar(512)
		DECLARE @PageLevel int
		
		IF((SELECT COUNT(*) FROM InnerPageCategories WHERE InnerPageCategoryId = @InnerPageCategoryId) = 0)
				BEGIN
					INSERT INTO InnerPageCategories VALUES
							(@ChapterId
							,@DisplayName 
							,NULL
							,@PageParentId
							,NULL 
							,@Position
							,@IsTopBar
							,@IsMenuBar
							,@IsQuickLinks
							,@IsFooterBar
							,@IsActive
							,@UpdatedBy
							,@UpdatedDate
							,@InsertedBy
							,@InsertedDate)
			 
					 SELECT @InnerPageCategoryId =  SCOPE_IDENTITY()
			 
					 IF(@PageParentId IS NULL)
						 BEGIN
							UPDATE InnerPageCategories SET IdPath = CAST(@InnerPageCategoryId as nvarchar(20)), PageLevel = 1  WHERE InnerPageCategoryId = @InnerPageCategoryId				
						 END
					 ELSE
						 BEGIN
							SELECT @IdPath = IdPath, @PageLevel = PageLevel + 1 FROM InnerPageCategories WHERE InnerPageCategoryId = @PageParentId
							UPDATE InnerPageCategories SET IdPath = @IdPath + '/' + CAST(@InnerPageCategoryId as nvarchar(20)), PageLevel = @PageLevel WHERE InnerPageCategoryId = @InnerPageCategoryId							 
						 END
			 
					 SELECT @QStatus = 1;	
				END
		ELSE
				BEGIN
					UPDATE InnerPageCategories
					   SET  ChapterId			=		@ChapterId
						   ,DisplayName			=		@DisplayName 
						   ,PageParentId		=		@PageParentId 
						   ,IsFooterBar			=		@IsFooterBar
						   ,IsMenuBar			=		@IsMenuBar
						   ,IsTopBar			=		@IsTopBar
						   ,IsQuickLinks		=		@IsQuickLinks 
						   ,Position			=		@Position
						   ,UpdatedBy			=		@UpdatedBy
						   ,UpdatedDate			=		@UpdatedDate
						   ,InsertedBy			=		@InsertedBy
						   ,InsertedDate		=		@InsertedDate 
					WHERE InnerPageCategoryId   =		@InnerPageCategoryId
			
					IF(@PageParentId IS NULL)
						 BEGIN
							UPDATE InnerPageCategories SET IdPath = CAST(@InnerPageCategoryId as nvarchar(20)), PageLevel = 1  WHERE InnerPageCategoryId = @InnerPageCategoryId				
						 END
					ELSE
						 BEGIN
							SELECT @IdPath = IdPath, @PageLevel = PageLevel + 1 FROM InnerPageCategories WHERE InnerPageCategoryId = @PageParentId
							UPDATE InnerPageCategories SET IdPath = @IdPath + '/' + CAST(@InnerPageCategoryId as nvarchar(20)), PageLevel = @PageLevel WHERE InnerPageCategoryId = @InnerPageCategoryId							 
						 END
			 		 
					SELECT @QStatus = 2;	
				END
    
    END TRY
    
    BEGIN CATCH    
		SELECT @QStatus = -1;    
    END CATCH    
    
END













GO
/****** Object:  StoredProcedure [dbo].[InnerPageCategoriesUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[InnerPageCategoriesUpdateStatus]
       (@InnerPageCategoryId bigint
       ,@QStatus bigint OUTPUT)
        
AS
BEGIN

	SET NOCOUNT ON;
	
	BEGIN TRY
	
			DECLARE @Query1 nvarchar(max)
			DECLARE @Query2 nvarchar(max)
			DECLARE @IsActive int
			
			IF((SELECT IsActive FROM InnerPageCategories WHERE InnerPageCategoryId = @InnerPageCategoryId) = 1)
				BEGIN
					SET @IsActive = 0
				END
			ELSE
				BEGIN
					SET @IsActive = 1
				END
			
			SET @Query1 = 'UPDATE InnerPageCategories SET IsActive = ' + CAST(@IsActive AS Nvarchar(10)) + ' WHERE InnerPageCategoryId IN (' + CAST((select dbo.SelectInnerPageCategoriesIdList(@InnerPageCategoryId,15)) as nvarchar(max)) + ')'
				 
			EXEC sp_ExecuteSQL @Query1;
			 
		 SELECT @QStatus = 1;
	END TRY
	
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH  
    
END











GO
/****** Object:  StoredProcedure [dbo].[InnerPagesDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[InnerPagesDelete]
    (@InnerPageId bigint
    ,@QStatus int output )  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY  
    BEGIN TRANSACTION  
		DELETE FROM InnerPages WHERE InnerPageId = @InnerPageId		
		SELECT @QStatus = 1;
		COMMIT TRANSACTION		
    END TRY

    BEGIN CATCH
    ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END
















GO
/****** Object:  StoredProcedure [dbo].[InnerPagesGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[InnerPagesGetById]
	(@InnerPageId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
	
   SET NOCOUNT ON;

    BEGIN TRY 
		 SELECT  InnerPageId
		        ,InnerPageCategoryId
				,Heading 
				,Description 
				,DisplayOrder 
				,IsActive 
				,PageTitle 
				,MetaDescription 
				,MetaKeywords 
				,Topline 
				,InsertedBy 
				,InsertedTime 
				,UpdatedBy 
				,UpdatedTime 
								
	  	 from InnerPages where InnerPageId=@InnerPageId
		 
		 SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END














GO
/****** Object:  StoredProcedure [dbo].[InnerPagesGetListById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[InnerPagesGetListById]
	 (@InnerPageId bigint
	 ,@Heading nvarchar(512)
	 ,@ChapterId bigint
	 ,@MemberId bigint
     ,@QStatus int output)
AS
BEGIN
	
	SET NOCOUNT ON;
	
	BEGIN TRY
	
	DECLARE @Query nvarchar(max);
   
		IF(@InnerPageId<>0)
		BEGIN
			 SELECT  * FROM InnerPages WHERE InnerPageId=@InnerPageId 		
		END
		
		IF(@Heading<>'')
		BEGIN
			 SELECT  * FROM InnerPages WHERE dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar(@Heading, '^a-z0-9') 
		END	
    SELECT @QStatus = 1; 	
	END TRY
    
    BEGIN CATCH  
       SELECT @QStatus = -1; 		   
    END CATCH   
END










GO
/****** Object:  StoredProcedure [dbo].[InnerPagesGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[InnerPagesGetListByVariable]
	 (@InnerPageCategoryId bigint
	 ,@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)
AS
BEGIN
	
	SET NOCOUNT ON;
	
	BEGIN TRY
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
    
    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
				,InnerPageId bigint
				,InnerPageCategoryId bigint
				,Heading nvarchar(512)
				,Description nvarchar(max)
				,DisplayOrder int
				,IsActive bit
				,PageTitle nvarchar(512)
				,MetaDescription nvarchar(1024)
				,MetaKeywords nvarchar(1024)
				,Topline nvarchar(2024)
				,InsertedBy nvarchar(64)
				,InsertedTime datetime
				,UpdatedBy nvarchar(64)
				,UpdatedTime datetime
				,CategoryName nvarchar(512))
				
	SELECT @Start = (@PageNo - 1) * @Items  
	   
	SELECT @End = @Start + @Items 
	
	SET @Query = 'INSERT INTO #temp 
		 SELECT  IP.InnerPageId 
				,IP.InnerPageCategoryId
				,IP.Heading
				,IP.Description
				,IP.DisplayOrder
				,IP.IsActive
				,IP.PageTitle
				,IP.MetaDescription
				,IP.MetaKeywords
				,IP.Topline
				,IP.InsertedBy
				,IP.InsertedTime 
				,IP.UpdatedBy
				,IP.UpdatedTime
				,IC.DisplayName as CategoryName
				FROM InnerPages IP
				INNER JOIN InnerPageCategories IC ON IC.InnerPageCategoryId=IP.InnerPageCategoryId  		
				WHERE IP.InnerPageId <> 0 '
		
		IF(@InnerPageCategoryId<>0)
		BEGIN
			SET @Query=@Query + ' AND IP.InnerPageCategoryId = ' + CAST(@InnerPageCategoryId as nvarchar(50))
		END

		IF(@Search <> '')
		BEGIN
			SET @Query = @Query + ' AND  IP.Heading LIKE ''%' + @Search + '%'''
		END

		IF(@Sort <> '')
		BEGIN
			SET @Query = @Query + ' ORDER BY ' + @Sort
		END
	
		EXEC sp_ExecuteSQL @Query;
		
		SELECT @Total = COUNT(Rid) from #temp 
				
		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
		DROP TABLE #temp

	END TRY
    
    BEGIN CATCH  
       SELECT @Total = -1; 		   
    END CATCH   
END












GO
/****** Object:  StoredProcedure [dbo].[InnerPagesInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[InnerPagesInsert]
    (@InnerPageId bigint
    ,@InnerPageCategoryId bigint
	,@Heading nvarchar(512)
	,@Description nvarchar(max)
	,@DisplayOrder int
	,@IsActive bit
	,@PageTitle nvarchar(512)
	,@MetaDescription nvarchar(1024)
	,@MetaKeywords nvarchar(1024)
	,@Topline nvarchar(2024)
	,@InsertedBy nvarchar(64)
	,@InsertedTime datetime
	,@UpdatedBy nvarchar(64)
	,@UpdatedTime datetime
	,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY
    BEGIN TRANSACTION
			IF((SELECT COUNT(*) FROM InnerPages WHERE InnerPageId = @InnerPageId) = 0)
					BEGIN
						INSERT INTO InnerPages VALUES
							(@InnerPageCategoryId 
							,@Heading 
							,@Description 
							,@DisplayOrder 
							,@IsActive 
							,@PageTitle
							,@MetaDescription 
							,@MetaKeywords 
							,@Topline 
							,@InsertedBy 
							,@InsertedTime 
							,@UpdatedBy 
							,@UpdatedTime 
							)		
			
						SELECT @QStatus = 1;	
					END
			ELSE
					BEGIN
						UPDATE InnerPages
						   SET InnerPageCategoryId=@InnerPageCategoryId, 
							   Heading=@Heading ,
							   Description =@Description ,
							   DisplayOrder=@DisplayOrder ,
							   IsActive=@IsActive ,
							   PageTitle=@PageTitle,
							   MetaDescription=@MetaDescription ,
							   MetaKeywords=@MetaKeywords ,
							   Topline=@Topline ,
							   InsertedBy=@InsertedBy ,
							   InsertedTime=@InsertedTime ,
							   UpdatedBy=@UpdatedBy ,
							   UpdatedTime=@UpdatedTime 
						 WHERE InnerPageId = @InnerPageId
		 		 
						 SELECT @QStatus = 2;	
					END
    COMMIT TRANSACTION
    END TRY
    
    BEGIN CATCH    
    ROLLBACK TRANSACTION
		SELECT @QStatus = -1;    
    END CATCH    
END












GO
/****** Object:  StoredProcedure [dbo].[InnerPagesUpdateDisplayOrder]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[InnerPagesUpdateDisplayOrder]
    (@InnerPageId bigint
    ,@DisplayOrder int
    ,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
    BEGIN TRANSACTION
		IF((SELECT COUNT(*) FROM InnerPages WHERE InnerPageId = @InnerPageId) = 1)
			BEGIN
				UPDATE InnerPages SET DisplayOrder = @DisplayOrder WHERE InnerPageId = @InnerPageId
				SELECT @QStatus = 1;
			END
		ELSE
			BEGIN
				SELECT @QStatus = 3;
			END	
	COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END




















GO
/****** Object:  StoredProcedure [dbo].[InnerPagesUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[InnerPagesUpdateStatus]
    (@InnerPageId bigint
    ,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
    BEGIN TRANSACTION
		IF((SELECT IsActive FROM InnerPages WHERE InnerPageId = @InnerPageId) = 1)
			BEGIN
				UPDATE InnerPages SET IsActive = 0 WHERE InnerPageId = @InnerPageId
			END
		ELSE
			BEGIN
				UPDATE InnerPages SET IsActive = 1 WHERE InnerPageId = @InnerPageId
			END		
		SELECT @QStatus = 1;
	COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END


















GO
/****** Object:  StoredProcedure [dbo].[LogReportGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[LogReportGetListByVariable]
	 (@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output
	 ,@StartDate nvarchar(256)
	 ,@EndDate nvarchar(256))
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	
	SET NOCOUNT ON;
	--BEGIN TRY
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
	
    -- Insert statements for procedure here

	CREATE TABLE #temp(Rid  INT PRIMARY KEY IDENTITY(1,1)
	,LogId bigint
    ,LogTitle nvarchar(256)
    ,LogDescription nvarchar(max)
    ,LogDate datetime
    ,InsertedBy nvarchar(64)
    ,InsertedDate datetime  
)

	SELECT @Start = (@PageNo - 1) * @Items  
	   
	SELECT @End = @Start + @Items 
	
	SET @Query = 'INSERT INTO #temp SELECT
			     C.LogId 
                ,C.LogTitle 
                ,C.LogDescription 
                ,C.LogDate 
                ,C.InsertedBy 
                ,C.InsertedDate 
                
				FROM LogReport C
				 WHERE C.LogId <> 0'
				
		IF(@Search <> '')
		BEGIN
			SET @Query = @Query + ' AND  C.LogTitle LIKE ''%' + @Search + '%'''
		END

		
				IF(@StartDate <> '' AND @EndDate <> '')
			BEGIN
				SET @Query = @Query + ' AND  (C.InsertedDate BETWEEN ''' + @StartDate + ''' AND ''' + @EndDate + ''')'
			END
			
			IF(@StartDate <> '' AND @EndDate = '')
			BEGIN
				SET @Query = @Query + ' AND  C.InsertedDate = '+CAST(@StartDate as nvarchar(50))
			END
				
				
		IF(@Sort <> '')
		BEGIN
			SET @Query = @Query + ' ORDER BY ' + @Sort
		END
	
		EXEC sp_ExecuteSQL @Query;
		
		SELECT @Total = COUNT(Rid) from #temp 
				
		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
		DROP TABLE #temp

	--END TRY
    
 --   BEGIN CATCH  
 --      SELECT @Total = -1; 		   
 --   END CATCH   
END
















 		 
		










GO
/****** Object:  StoredProcedure [dbo].[MailTemplatesDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[MailTemplatesDelete]
    (@MailTemplateId bigint
    ,@QStatus int output )  
        
AS
BEGIN

	
	SET NOCOUNT ON;
    
    BEGIN TRY  
    BEGIN TRANSACTION  
		DELETE FROM MailTemplates WHERE MailTemplateId = @MailTemplateId		
		SELECT @QStatus = 1;
		COMMIT TRANSACTION		
    END TRY
    BEGIN CATCH
    ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END















GO
/****** Object:  StoredProcedure [dbo].[MailTemplatesGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MailTemplatesGetById]
	(@MailTemplateId bigint
	,@TemplateName nvarchar(256)
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
	
   SET NOCOUNT ON;

    BEGIN TRY 
        IF(@MailTemplateId!=0)
		   BEGIN
			 SELECT * FROM MailTemplates WHERE MailTemplateId  = @MailTemplateId
			 SELECT @QStatus = 1;
		   END
		ELSE IF(@TemplateName!='')
			BEGIN
				SELECT * FROM MailTemplates WHERE dbo.RemoveSpecialChar(Heading, '^a-z0-9')=dbo.RemoveSpecialChar(@TemplateName, '^a-z0-9')
				SELECT @QStatus = 1;
			END
		ELSE
			BEGIN
				SELECT @QStatus = -1;
			END
		 SELECT @QStatus = 1;
		 
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END

























GO
/****** Object:  StoredProcedure [dbo].[MailTemplatesGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MailTemplatesGetList]
	(@MailType nvarchar(128),
    @QStatus int output)
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY
			IF(@MailType<>'')
				BEGIN
					SELECT * FROM MailTemplates	WHERE MailType=@MailType
					SELECT @QStatus = 1;
				END
			ELSE
				BEGIN
					SELECT * FROM MailTemplates
				END
    END TRY
    BEGIN CATCH
    
		 SELECT @QStatus = -1;
		 
    END CATCH
    	
END


























GO
/****** Object:  StoredProcedure [dbo].[MailTemplatesGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MailTemplatesGetListByVariable]
	 (@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)
AS
BEGIN
	
	SET NOCOUNT ON;
	
	BEGIN TRY
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
	
    
    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
				,MailTemplateId bigint
				,Heading nvarchar(512)
				,Subject nvarchar(512)
				,Description nvarchar(max)
				,MailType nvarchar(50)
				,UpdatedBy nvarchar(64)
				,UpdatedTime datetime)
				
	SELECT @Start = (@PageNo - 1) * @Items  
	   
	SELECT @End = @Start + @Items 
	
	SET @Query = 'INSERT INTO #temp SELECT 
	             E.MailTemplateId
	            ,E.Heading
	            ,E.Subject
	            ,E.Description
	            ,E.MailType
	            ,E.UpdatedBy
	            ,E.UpdatedTime
	             FROM MailTemplates E
		WHERE E.MailTemplateId <> 0 '
		
		
		IF(@Search <> '')
		BEGIN
			SET @Query = @Query + ' AND  E.Heading LIKE ''%' + @Search + '%'''
		END

		IF(@Sort <> '')
		BEGIN
			SET @Query = @Query + ' ORDER BY ' + @Sort
		END
	
		EXEC sp_ExecuteSQL @Query;
		
		SELECT @Total = COUNT(Rid) from #temp 
				
		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
		DROP TABLE #temp

	END TRY
    
    BEGIN CATCH  
       SELECT @Total = -1; 		   
    END CATCH   
END










GO
/****** Object:  StoredProcedure [dbo].[MailTemplatesInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
  
CREATE PROCEDURE [dbo].[MailTemplatesInsert]  
    (@MailTemplateId bigint  
 ,@Heading nvarchar(512)  
 ,@Subject nvarchar(512)  
 ,@Description nvarchar(max)  
 ,@MailType nvarchar(50)  
 ,@UpdatedBy nvarchar(64)  
 ,@UpdatedTime datetime  
 ,@QStatus int output)    
          
AS  
BEGIN  
   
 SET NOCOUNT ON;  
      
    BEGIN TRY  
    BEGIN TRANSACTION  
   IF((SELECT COUNT(*) FROM MailTemplates WHERE MailTemplateId = @MailTemplateId) = 0)  
    BEGIN  
     INSERT INTO MailTemplates VALUES  
      (@Heading  
      ,@Subject  
      ,@Description
      ,@MailType  
      ,@UpdatedBy  
      ,@UpdatedTime)    
     
     SELECT @QStatus = 1;   
    END  
   ELSE  
    BEGIN  
     UPDATE MailTemplates  
        SET  Heading=@Heading,  
         Subject=@Subject,  
         Description=@Description,  
         MailType=@MailType,  
         UpdatedBy=@UpdatedBy ,  
         UpdatedTime=@UpdatedTime  
      WHERE MailTemplateId = @MailTemplateId  
        
      SELECT @QStatus = 2;   
    END  
    COMMIT TRANSACTION  
    END TRY  
      
    BEGIN CATCH      
    ROLLBACK TRANSACTION  
  SELECT @QStatus = -1;      
    END CATCH      
END  
  
  
  
  
  
  
  
  
  
  
  



GO
/****** Object:  StoredProcedure [dbo].[MenuItemsDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MenuItemsDelete]
    (@MenuItemId bigint
    ,@QStatus int OUTPUT)  
        
AS
BEGIN
	
	SET NOCOUNT ON;

    BEGIN TRY    
		DELETE FROM MenuItems WHERE MenuItemId = @MenuItemId	    
		SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END












GO
/****** Object:  StoredProcedure [dbo].[MenuItemsGetAll]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MenuItemsGetAll]
    (@QStatus int OUTPUT)  
        
AS
BEGIN
	
	SET NOCOUNT ON;

    BEGIN TRY    
	    SELECT MenuItemId
			  ,DisplayName 
			  ,PageLevel
			  ,PageParentId
			  ,IdPath 
			  ,Position
			  ,IsFooterBar
			  ,IsMenuBar
			  ,IsTopBar
			  ,IsQuickLinks
			  ,IsActive
			  ,UpdatedBy
			  ,UpdatedDate
			  ,InsertedBy
			  ,InsertedDate
			  ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = c.PageParentId) AS ParentActive 
			  ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = c.MenuItemId AND IsActive = 1) AS SubMenuItemCount
	          FROM MenuItems c WHERE c.IsActive = 1 ORDER BY IdPath, Position

		SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END












GO
/****** Object:  StoredProcedure [dbo].[MenuItemsGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MenuItemsGetById]
	(@MenuItemId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

	
	SET NOCOUNT ON;

    BEGIN TRY 
		SELECT *, (Select DisplayName From MenuItems Where MenuItemId = M.PageParentId) as ParentName FROM MenuItems M WHERE MenuItemId = @MenuItemId
	    SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH		
	 
END











GO
/****** Object:  StoredProcedure [dbo].[MenuItemsGetByLevel]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MenuItemsGetByLevel]
	(@PageLevel int
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
	
	SET NOCOUNT ON;

   BEGIN TRY 
		SELECT * FROM MenuItems  WHERE PageLevel = @PageLevel
	    SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH		
	 
END











GO
/****** Object:  StoredProcedure [dbo].[MenuItemsGetByName]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MenuItemsGetByName]
	(@DisplayName nvarchar(256)
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
	
	SET NOCOUNT ON;

   BEGIN TRY 
		SELECT * FROM MenuItems  WHERE DisplayName = @DisplayName
	    SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH		
	 
END











GO
/****** Object:  StoredProcedure [dbo].[MenuItemsGetByParentId]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MenuItemsGetByParentId]
	(@PageParentId int
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

	
	SET NOCOUNT ON;

    BEGIN TRY 
		SELECT * FROM MenuItems  WHERE PageParentId = @PageParentId
	    SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH		
	 
END











GO
/****** Object:  StoredProcedure [dbo].[MenuItemsGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[MenuItemsGetList]
	@ChapterId bigint,
	@QStatus int OUTPUT
        
AS
BEGIN

	BEGIN TRY
		DECLARE @Query nvarchar(max);
		DECLARE @Start int, @End INT ;
	    
		SET NOCOUNT ON;
		    
		SELECT MenuItemId
			  ,ChapterId
			  ,DisplayName  
			  ,PageLevel
			  ,PageParentId
			  ,IdPath 
			  ,IsFooterBar
			  ,IsMenuBar
			  ,IsTopBar
			  ,IsQuickLinks
			  ,Position
			  ,IsActive
			  ,UpdatedBy
			  ,UpdatedDate
			  ,InsertedBy
			  ,InsertedDate
			  ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = c.PageParentId) AS ParentActive 
			  ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = c.MenuItemId) AS SubMenuItemCount
			  ,(Select TOP(1) PageDetailId From MenuPages Where MenuItemId = c.MenuItemId) as PageDetailId
			  ,(Select TOP(1) MenuPageId From MenuPages Where MenuItemId = c.MenuItemId) as MenuPageId
			  ,(Select PageUrl From PageDetails Where PageDetailId = (Select TOP(1) PageDetailId From MenuPages Where MenuItemId = c.MenuItemId)) as PageUrl
			  ,(Select ShortName From Chapters Where ChapterId = c.ChapterId) as ChapterName
	          FROM MenuItems c WHERE c.ChapterId = @ChapterId ORDER BY Position ASC

	          SELECT @QStatus = 1;		
	END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH  
    
END











GO
/****** Object:  StoredProcedure [dbo].[MenuItemsGetListbkp]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MenuItemsGetListbkp]
	@ChapterId bigint,
	@IsFooterBar bit,
	@IsMenuBar bit,
	@IsQuickLinks bit,
	@QStatus int OUTPUT
        
AS
BEGIN

	BEGIN TRY
		DECLARE @Query nvarchar(max);
		DECLARE @Start int, @End INT ;
	    
		SET NOCOUNT ON;
		    
		SELECT MenuItemId
			  ,ChapterId
			  ,DisplayName  
			  ,PageLevel
			  ,PageParentId
			  ,IdPath 
			  ,IsFooterBar
			  ,IsMenuBar
			  ,IsTopBar
			  ,IsQuickLinks
			  ,Position
			  ,IsActive
			  ,UpdatedBy
			  ,UpdatedDate
			  ,InsertedBy
			  ,InsertedDate
			  ,(SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = c.PageParentId) AS ParentActive 
			  ,(SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = c.MenuItemId) AS SubMenuItemCount
			  ,(Select TOP(1) PageDetailId From MenuPages Where MenuItemId = c.MenuItemId) as PageDetailId
			  ,(Select TOP(1) MenuPageId From MenuPages Where MenuItemId = c.MenuItemId) as MenuPageId
			  ,(Select PageUrl From PageDetails Where PageDetailId = (Select TOP(1) PageDetailId From MenuPages Where MenuItemId = c.MenuItemId)) as PageUrl
			  ,(Select ShortName From Chapters Where ChapterId = c.ChapterId) as ChapterName
	          FROM MenuItems c WHERE c.ChapterId = @ChapterId  
			  AND (@IsFooterBar =0 OR c.IsFooterBar = @IsFooterBar)
			 AND (@IsMenuBar =0 OR c.IsMenuBar = @IsMenuBar)
			 AND (@IsQuickLinks =0 OR c.IsQuickLinks = @IsQuickLinks)
			  
			  
			  ORDER BY Position ASC

	          SELECT @QStatus = 1;		
	END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH  
    
END







GO
/****** Object:  StoredProcedure [dbo].[MenuItemsGetLists]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MenuItemsGetLists]  
    @ChapterId bigint,  
    @SearchTerm nvarchar(255) = NULL,  -- New search parameter
    @QStatus int OUTPUT  
AS  
BEGIN  
    BEGIN TRY  
        SET NOCOUNT ON;  
        
        SELECT 
            MenuItemId,
            ChapterId,
            DisplayName,
            PageLevel,
            PageParentId,
            IdPath,
            IsFooterBar,
            IsMenuBar,
            IsTopBar,
            IsQuickLinks,
            Position,
            IsActive,
            UpdatedBy,
            UpdatedDate,
            InsertedBy,
            InsertedDate,
            (SELECT IsActive FROM MenuItems WHERE MenuItems.MenuItemId = c.PageParentId) AS ParentActive,
            (SELECT COUNT(*) FROM MenuItems AS CATCOUNT WHERE CATCOUNT.PageParentId = c.MenuItemId) AS SubMenuItemCount,
            (SELECT TOP(1) PageDetailId FROM MenuPages WHERE MenuItemId = c.MenuItemId) as PageDetailId,
            (SELECT TOP(1) MenuPageId FROM MenuPages WHERE MenuItemId = c.MenuItemId) as MenuPageId,
            (SELECT PageUrl FROM PageDetails WHERE PageDetailId = (SELECT TOP(1) PageDetailId FROM MenuPages WHERE MenuItemId = c.MenuItemId)) as PageUrl,
            (SELECT ShortName FROM Chapters WHERE ChapterId = c.ChapterId) as ChapterName
        FROM 
            MenuItems c
        WHERE 
            c.ChapterId = @ChapterId
            AND (@SearchTerm IS NULL OR c.DisplayName LIKE '%' + @SearchTerm + '%')
        ORDER BY 
            Position ASC;
        
        -- Set the status to indicate success
        SELECT @QStatus = 1;    
    END TRY  
    BEGIN CATCH  
        -- Set the status to indicate failure
        SELECT @QStatus = -1;  
    END CATCH    
END;




GO
/****** Object:  StoredProcedure [dbo].[MenuItemsInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[MenuItemsInsert]
    (@MenuItemId bigint
	,@ChapterId bigint
    ,@DisplayName nvarchar(256) 
	,@PageParentId bigint 
	,@IsTopBar bit
	,@IsMenuBar bit
	,@IsQuickLinks bit
	,@IsFooterBar bit
	,@Position int						
	,@IsActive bit
	,@UpdatedBy nvarchar(64)
	,@UpdatedDate datetime
	,@InsertedBy nvarchar(64)
	,@InsertedDate datetime
	,@QStatus int OUTPUT)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    --BEGIN TRY
    --BEGIN TRANSACTION
		DECLARE @IdPath nvarchar(512)
		DECLARE @PageLevel int
		
		IF((SELECT COUNT(*) FROM MenuItems WHERE MenuItemId = @MenuItemId) = 0)
			BEGIN
				INSERT INTO MenuItems VALUES
						(@ChapterId
						,@DisplayName 
						,NULL
						,@PageParentId
						,NULL 
						,@Position
						,@IsTopBar
						,@IsMenuBar
						,@IsQuickLinks
						,@IsFooterBar
						,@IsActive
						,@UpdatedBy
						,@UpdatedDate
						,@InsertedBy
						,@InsertedDate)
			 
				 SELECT @MenuItemId =  SCOPE_IDENTITY()
			 
				 IF(@PageParentId IS NULL)
					 BEGIN
						UPDATE MenuItems SET IdPath = CAST(@MenuItemId as nvarchar(20)), PageLevel = 1  WHERE MenuItemId = @MenuItemId				
					 END
				 ELSE
					 BEGIN
						SELECT @IdPath = IdPath, @PageLevel = PageLevel + 1 FROM MenuItems WHERE MenuItemId = @PageParentId
						UPDATE MenuItems SET IdPath = @IdPath + '/' + CAST(@MenuItemId as nvarchar(20)), PageLevel = @PageLevel WHERE MenuItemId = @MenuItemId							 
					 END
			 
				 SELECT @QStatus = 1;	
			END
		ELSE
			BEGIN
				UPDATE MenuItems
				   SET  ChapterId = @ChapterId
					   ,DisplayName=@DisplayName 
					   ,PageParentId=@PageParentId 
					   ,IsFooterBar=@IsFooterBar
					   ,IsMenuBar=@IsMenuBar
					   ,IsTopBar=@IsTopBar
					   ,IsQuickLinks=@IsQuickLinks 
					   ,Position = @Position
					   ,UpdatedBy=@UpdatedBy
					   ,UpdatedDate=@UpdatedDate
					   ,InsertedBy=@InsertedBy
					   ,InsertedDate=@InsertedDate 
				WHERE MenuItemId = @MenuItemId
			
				 IF(@PageParentId IS NULL)
					 BEGIN
						UPDATE MenuItems SET IdPath = CAST(@MenuItemId as nvarchar(20)), PageLevel = 1  WHERE MenuItemId = @MenuItemId				
					 END
				 ELSE
					 BEGIN
						SELECT @IdPath = IdPath, @PageLevel = PageLevel + 1 FROM MenuItems WHERE MenuItemId = @PageParentId
						UPDATE MenuItems SET IdPath = @IdPath + '/' + CAST(@MenuItemId as nvarchar(20)), PageLevel = @PageLevel WHERE MenuItemId = @MenuItemId							 
					 END
			 		 
				SELECT @QStatus = 2;	
				--COMMIT TRANSACTION
			END
    
  --  END TRY
    
  --  BEGIN CATCH    
	 --   ROLLBACK TRANSACTION
		--SELECT @QStatus = -1;    
  --  END CATCH    
    
END











GO
/****** Object:  StoredProcedure [dbo].[MenuItemsUpdateOrderNo]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[MenuItemsUpdateOrderNo]
    (@MenuItemId bigint
    ,@Position int
    ,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		BEGIN TRANSACTION
    
			IF((SELECT COUNT(*) FROM MenuItems WHERE MenuItemId = @MenuItemId) = 1)
				BEGIN
					UPDATE MenuItems SET Position = @Position WHERE MenuItemId = @MenuItemId
					SELECT @QStatus = 1;
				END
			ELSE
				BEGIN
					SELECT @QStatus = 3;
				END	
		COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END













GO
/****** Object:  StoredProcedure [dbo].[MenuItemsUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MenuItemsUpdateStatus]
       (@MenuItemId bigint
       ,@QStatus bigint OUTPUT)
        
AS
BEGIN

	SET NOCOUNT ON;
	
	BEGIN TRY
			DECLARE @Query1 nvarchar(max)
			DECLARE @Query2 nvarchar(max)
			DECLARE @IsActive int
			
			IF((SELECT IsActive FROM MenuItems WHERE MenuItemId = @MenuItemId) = 'True')
				BEGIN
					SET @IsActive = 0
				END
			ELSE
				BEGIN
					SET @IsActive = 1
				END
			
			SET @Query1 = 'UPDATE MenuItems SET IsActive = ' + CAST(@IsActive AS Nvarchar(10)) + ' WHERE MenuItemId IN (' + CAST((select dbo.SelectMenuItemsIdList(@MenuItemId,6)) as nvarchar(max)) + ')'
				 
			EXEC sp_ExecuteSQL @Query1;
			 
		    SELECT @QStatus = 1;
	END TRY
	
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH  
    
END











GO
/****** Object:  StoredProcedure [dbo].[MenuPagesDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MenuPagesDelete]
    (@MenuPageId bigint
    ,@QStatus int output )  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY  
        BEGIN TRANSACTION  
		DELETE FROM MenuPages WHERE MenuPageId = @MenuPageId		
		SELECT @QStatus = 1;
		COMMIT TRANSACTION		
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END











GO
/****** Object:  StoredProcedure [dbo].[MenuPagesDetailsGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[MenuPagesDetailsGetById]
	(@PageDetailId bigint
    ,@QStatus int OUTPUT)    
AS
BEGIN
    SET NOCOUNT ON;

   -- BEGIN TRY 
		 SELECT  * from PageDetails where PageDetailId=@PageDetailId
		 SELECT  * from MenuPages where PageDetailId=@PageDetailId


		 SELECT  * from MenuItems where MenuItemId=(SELECT top(1)  MenuItemId from MenuPages where PageDetailId=@PageDetailId order by MenuItemId asc)


		 SELECT @QStatus = 1;
   -- END TRY
    
   -- BEGIN CATCH
		 --SELECT @QStatus = -1;
   -- END CATCH	
	 
END




















GO
/****** Object:  StoredProcedure [dbo].[MenuPagesGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MenuPagesGetById]
	(@MenuPageId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
	
   SET NOCOUNT ON;

    BEGIN TRY 
    
		 SELECT *, (Select Heading From PageDetails Where PageDetailId = MP.PageDetailId) as Heading from MenuPages MP where MP.MenuPageId=@MenuPageId
		 
		 SELECT @QStatus = 1;
		 
    END TRY
    
    BEGIN CATCH
    
		 SELECT @QStatus = -1;
		 
    END CATCH	
	 
END











GO
/****** Object:  StoredProcedure [dbo].[MenuPagesGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MenuPagesGetList]
    @QStatus int output
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY
		SELECT * FROM MenuPages	
		SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END












GO
/****** Object:  StoredProcedure [dbo].[MenuPagesGetListByMenuItemId]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MenuPagesGetListByMenuItemId]
	@MenuItemId bigint,
    @QStatus int output
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY
		SELECT distinct PageDetailId ,* FROM PageDetails C where PageDetailId NOT IN (select PageDetailId from MenuPages where MenuItemId=@MenuItemId)
		SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END












GO
/****** Object:  StoredProcedure [dbo].[MenuPagesInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MenuPagesInsert]
    (@MenuPageId bigint
    ,@PageDetailId bigint
    ,@MenuItemId bigint 
	,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY
    BEGIN TRANSACTION
		IF((SELECT COUNT(*) FROM MenuPages WHERE MenuPageId = @MenuPageId) = 0)
			BEGIN
				INSERT INTO MenuPages VALUES
					(@MenuItemId
					,@PageDetailId)		
			
				SELECT @QStatus = 1;	
			END
		ELSE
			BEGIN
				UPDATE MenuPages SET  PageDetailId=@PageDetailId  WHERE MenuPageId = @MenuPageId
		 		 
				 SELECT @QStatus = 2;	
			END
    COMMIT TRANSACTION
    END TRY
    
    BEGIN CATCH    
    ROLLBACK TRANSACTION
		SELECT @QStatus = -1;    
    END CATCH    
END










GO
/****** Object:  StoredProcedure [dbo].[MenuPagesList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[MenuPagesList]
	 (@MenuItemId BIGINT
	 ,@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)
AS
BEGIN
	
	SET NOCOUNT ON;
	
	BEGIN TRY
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
    
    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
				,PageDetailId bigint
				,Heading nvarchar(512)
				,PageUrl nvarchar(512)
				,DisplayName nvarchar(512)
				,UpdatedBy nvarchar(64)
				,UpdatedDate datetime
				,MenuPageId bigint
				,MenuItemId bigint)

				
	SELECT @Start = (@PageNo - 1) * @Items  
	   
	SELECT @End = @Start + @Items 
	
	SET @Query = 'INSERT INTO #temp SELECT
	             C.PageDetailId
	            ,C.Heading
				,C.PageUrl
				,CC.DisplayName 
				,C.UpdatedBy
				,C.UpdatedDate
				,CM.MenuPageId
				,CM.MenuItemId
				FROM PageDetails C 
				INNER JOIN MenuPages CM ON CM.PageDetailId=C.PageDetailId	
				INNER JOIN MenuItems CC ON CC.MenuItemId=CM.MenuItemId 
				WHERE C.PageDetailId <> 0'
		
		
		IF(@MenuItemId <> 0)
		BEGIN
			SET @Query=@Query + ' AND CM.MenuItemId = ' + CAST(@MenuItemId AS nvarchar(30))
		END 
		
		IF(@Search <> '')
		BEGIN
			SET @Query = @Query + ' AND  C.Heading LIKE ''%' + @Search + '%'''
		END

		IF(@Sort <> '')
		BEGIN
			SET @Query = @Query + ' ORDER BY ' + @Sort
		END
	
		EXEC sp_ExecuteSQL @Query;
		
		SELECT @Total = COUNT(Rid) from #temp 
				
		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
		DROP TABLE #temp

	END TRY
    
    BEGIN CATCH  
       SELECT @Total = -1; 		   
    END CATCH   
END











GO
/****** Object:  StoredProcedure [dbo].[PageDetailsDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[PageDetailsDelete]
    (@PageDetailId bigint
    ,@QStatus int output )  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY  
        BEGIN TRANSACTION  
			DELETE FROM PageDetails WHERE PageDetailId = @PageDetailId		
			SELECT @QStatus = 1;
		COMMIT TRANSACTION		
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END











GO
/****** Object:  StoredProcedure [dbo].[PageDetailsGetByHeading]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[PageDetailsGetByHeading]
           (@Heading nvarchar(512)
           ,@QStatus int output)  
         
AS
BEGIN

    SET NOCOUNT ON;

    BEGIN TRY 
       SELECT * from PageDetails WHERE dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar(@Heading, '^a-z0-9')
	   SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	

END









GO
/****** Object:  StoredProcedure [dbo].[PageDetailsGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[PageDetailsGetById]
	(@PageDetailId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

    SET NOCOUNT ON;

    BEGIN TRY 
		 SELECT  * from PageDetails where PageDetailId=@PageDetailId
		 SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END











GO
/****** Object:  StoredProcedure [dbo].[PageDetailsGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[PageDetailsGetList]
	 (@QStatus int output)
AS
BEGIN
	
	SET NOCOUNT ON;
	
	BEGIN TRY
	    DECLARE @Query nvarchar(max);
		SELECT  * FROM PageDetails Order By Heading ASC
		SELECT @QStatus = 1; 
	END TRY   
	
    BEGIN CATCH  
       SELECT @QStatus = -1; 		   
    END CATCH   
END











GO
/****** Object:  StoredProcedure [dbo].[PageDetailsGetListById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[PageDetailsGetListById]
	 (@ChapterId bigint
	 ,@Heading nvarchar(512)
	 ,@PageUrl nvarchar(512)
	 ,@MenuItemId bigint
	 ,@IDPath nvarchar(128) output
     ,@QStatus int output)
AS
BEGIN
	
	SET NOCOUNT ON;
	
	BEGIN TRY
		DECLARE @Query nvarchar(max);
		Declare @PageDetailId bigint
    
		IF(@MenuItemId <> 0)
			BEGIN
				Select @IDPath = IDPath From MenuItems Where MenuItemId = @MenuItemId
			END

		Select @PageDetailId = PageDetailId from MenuPages Where MenuItemId = @MenuItemId

		IF(@PageDetailId<>0)
			BEGIN
				 SELECT  * FROM PageDetails WHERE PageDetailId=@PageDetailId 		
			END 
		ELSE IF(@PageUrl <> '')
			BEGIN
				IF((Select Count(*) From PageDetails Where PageUrl = @PageUrl) = 1)
					BEGIN
						SELECT  * FROM PageDetails WHERE PageUrl = @PageUrl
					END
			END 
		ELSE IF(@Heading<>'')
			BEGIN
				 SELECT  * FROM PageDetails WHERE dbo.RemoveSpecialChar(Heading, '^a-z0-9') = dbo.RemoveSpecialChar(@Heading, '^a-z0-9')
			END
		SELECT @QStatus = 1; 
	END TRY  
	
    BEGIN CATCH  
       SELECT @QStatus = -1; 		   
    END CATCH   
END










GO
/****** Object:  StoredProcedure [dbo].[PageDetailsGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[PageDetailsGetListByVariable]
	 (@ChapterId bigint
	 ,@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)
AS
BEGIN
	
	SET NOCOUNT ON;
	
	BEGIN TRY
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
    
    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
				,PageDetailId bigint 
				,Heading nvarchar(256)
				,Description nvarchar(max)
				,PageUrl nvarchar(512)
				,DocumentUrl nvarchar(512)
				,Target nvarchar(256)
				,IsActive bit
				,PageTitle nvarchar(512)
				,MetaDescription nvarchar(1024)
				,MetaKeywords nvarchar(1024)
				,Topline nvarchar(2024)
				,InsertedBy nvarchar(64)
				,InsertedDate datetime
				,UpdatedBy nvarchar(64)
				,UpdatedDate datetime 
				,ChapterId bigint
				,ChapterName nvarchar(128)
				,OtherUrl nvarchar(512))

				
			SELECT @Start = (@PageNo - 1) * @Items  
	   
			SELECT @End = @Start + @Items 
	
			SET @Query = 'INSERT INTO #temp 
				 SELECT Distinct IP.PageDetailId  
				,IP.Heading
				,IP.Description
				,IP.PageUrl
				,IP.DocumentUrl
				,IP.Target
				,IP.IsActive
				,IP.PageTitle
				,IP.MetaDescription
				,IP.MetaKeywords
				,IP.Topline
				,IP.InsertedBy
				,IP.InsertedDate 
				,IP.UpdatedBy
				,IP.UpdatedDate
				,0 as ChapterId
				,'''' as ChapterName
				,IP.OtherUrl
				FROM PageDetails IP 
				WHERE IP.PageDetailId <> 0 '
		
	IF(@ChapterId <> '' and @ChapterId <> 1)
			BEGIN
				SET @Query = @Query + ' AND  MI.ChapterId = '+ CAST(@ChapterId as nvarchar(64))
			END
		IF(@Search <> '')
			BEGIN
				SET @Query = @Query + ' AND  IP.Heading LIKE ''%' + @Search + '%'''
			END
		IF(@Sort <> '')
			BEGIN
				SET @Query = @Query + ' ORDER BY ' + @Sort
			END
	
		EXEC sp_ExecuteSQL @Query;
		
		SELECT @Total = COUNT(Rid) from #temp 
				
		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
		DROP TABLE #temp
	END TRY
    
    BEGIN CATCH  
       SELECT @Total = -1; 		   
    END CATCH   
END









GO
/****** Object:  StoredProcedure [dbo].[PageDetailsInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
  
CREATE PROCEDURE [dbo].[PageDetailsInsert]  
    (@PageDetailId bigint   
 ,@Heading nvarchar(256)  
 ,@Description nvarchar(max)  
 ,@PageUrl nvarchar(512)  
 ,@DocumentUrl nvarchar(512)  
 ,@Target nvarchar(25)  
 ,@IsActive bit  
 ,@PageTitle nvarchar(512)  
 ,@MetaDescription nvarchar(1024)  
 ,@MetaKeywords nvarchar(1024)  
 ,@Topline nvarchar(2024)  
 ,@InsertedBy nvarchar(64)  
 ,@InsertedDate datetime  
 ,@UpdatedBy nvarchar(64)  
 ,@UpdatedDate datetime  
 ,@OtherUrl nvarchar(512)  
 ,@QStatus int output  
 --MenuItems--  
 ,@MenuItemId bigint  
 ,@ChapterId bigint  
    ,@DisplayName nvarchar(256)   
 ,@AddPage nvarchar(256)  
 ,@PageParentId bigint   
 ,@IsTopBar bit  
 ,@IsMenuBar bit  
 ,@IsQuickLinks bit  
 ,@IsFooterBar bit  
 ,@ExistingMenuItemId bigint  
 ,@Position int)    
          
AS  
BEGIN  
   
 SET NOCOUNT ON;  
     DECLARE @IdPath nvarchar(512)  
  DECLARE @PageLevel int  
    --BEGIN TRY  
    --BEGIN TRANSACTION  
  IF((SELECT COUNT(*) FROM PageDetails WHERE PageDetailId = @PageDetailId or Heading=@Heading) = 0)  
   BEGIN  
    INSERT INTO PageDetails VALUES  
     (@Heading   
     ,@Description   
     ,Case When (Select Count(*) from PageDetails Where PageUrl = @PageUrl) <> 0 Then @PageUrl + '-new' else @PageUrl END  
     ,@DocumentUrl  
     ,@Target   
     ,@PageTitle  
     ,@MetaDescription   
     ,@MetaKeywords   
     ,@Topline   
     ,@IsActive   
     ,@UpdatedBy   
     ,@UpdatedDate  
     ,@InsertedBy   
     ,@InsertedDate   
     ,@OtherUrl,  
      @AddPage)    
   SELECT @PageDetailId =  SCOPE_IDENTITY()  
    if(@AddPage='New Menu Item')  
   BEGIN  
    INSERT INTO MenuItems VALUES  
      (@ChapterId  
      ,@DisplayName   
      ,NULL  
      ,@PageParentId  
      ,NULL   
      ,@Position  
      ,@IsTopBar  
      ,@IsMenuBar  
      ,@IsQuickLinks  
      ,@IsFooterBar  
      ,@IsActive  
      ,@UpdatedBy  
      ,@UpdatedDate  
      ,@InsertedBy  
      ,@InsertedDate)  
      
     SELECT @MenuItemId =  SCOPE_IDENTITY()  
      
     IF(@PageParentId IS NULL)  
      BEGIN  
      UPDATE MenuItems SET IdPath = CAST(@MenuItemId as nvarchar(20)), PageLevel = 1  WHERE MenuItemId = @MenuItemId      
      END  
     ELSE  
      BEGIN  
      SELECT @IdPath = IdPath, @PageLevel = PageLevel + 1 FROM MenuItems WHERE MenuItemId = @PageParentId  
      UPDATE MenuItems SET IdPath = @IdPath + '/' + CAST(@MenuItemId as nvarchar(20)), PageLevel = @PageLevel WHERE MenuItemId = @MenuItemId          
      END  
  
      INSERT INTO MenuPages VALUES  
       (@MenuItemId  
       ,@PageDetailId)   
          

  end
     if(@AddPage='Existing Menu')  
   BEGIN  
     
      INSERT INTO MenuPages VALUES  
       (@ExistingMenuItemId  
       ,@PageDetailId)   
   End 
 
    SELECT @QStatus = 1;   
   end  
   
    ELSE  
   BEGIN  
    UPDATE PageDetails  
       SET Heading   = @Heading ,  
        Description  = @Description ,  
        PageUrl   = Case When (Select Count(*) from PageDetails Where PageDetailId <> @PageDetailId AND PageUrl = @PageUrl) <> 0 Then @PageUrl + '-new' else @PageUrl END,   
        OtherUrl   = @OtherUrl,  
        DocumentUrl  = @DocumentUrl,  
        Target   = @Target,  
        PageTitle  = @PageTitle,  
        MetaDescription  = @MetaDescription ,  
        MetaKeywords  = @MetaKeywords ,  
        Topline   = @Topline ,   
        UpdatedBy  = @UpdatedBy ,  
        UpdatedDate  = @UpdatedDate ,AddPage=@AddPage  
     WHERE PageDetailId  = @PageDetailId  
  
     if(@AddPage='New Menu Item')  
   BEGIN  
   IF((SELECT COUNT(*) FROM MenuItems WHERE MenuItemId = @MenuItemId) = 0)  
   BEGIN  
    INSERT INTO MenuItems VALUES  
      (@ChapterId  
      ,@DisplayName   
      ,NULL  
      ,@PageParentId  
      ,NULL   
      ,@Position  
      ,@IsTopBar  
      ,@IsMenuBar  
      ,@IsQuickLinks  
      ,@IsFooterBar  
      ,@IsActive  
      ,@UpdatedBy  
      ,@UpdatedDate  
      ,@InsertedBy  
      ,@InsertedDate)  
      
     SELECT @MenuItemId =  SCOPE_IDENTITY()  
      
     IF(@PageParentId IS NULL)  
      BEGIN  
      UPDATE MenuItems SET IdPath = CAST(@MenuItemId as nvarchar(20)), PageLevel = 1  WHERE MenuItemId = @MenuItemId      
      END  
     ELSE  
      BEGIN  
      SELECT @IdPath = IdPath, @PageLevel = PageLevel + 1 FROM MenuItems WHERE MenuItemId = @PageParentId  
      UPDATE MenuItems SET IdPath = @IdPath + '/' + CAST(@MenuItemId as nvarchar(20)), PageLevel = @PageLevel WHERE MenuItemId = @MenuItemId          
      END  
  
      INSERT INTO MenuPages VALUES  
       (@MenuItemId  
       ,@PageDetailId)   
  end
       ELSE  
      BEGIN  
  
      UPDATE MenuItems  
       SET    
        DisplayName=@DisplayName   
        ,PageParentId=@PageParentId   
        ,IsFooterBar=@IsFooterBar  
        ,IsMenuBar=@IsMenuBar  
        ,IsTopBar=@IsTopBar  
        ,IsQuickLinks=@IsQuickLinks   
        ,Position = @Position  
        ,UpdatedBy=@UpdatedBy  
        ,UpdatedDate=@UpdatedDate  
        ,InsertedBy=@InsertedBy  
        ,InsertedDate=@InsertedDate   
        ,ChapterId=@ChapterId  
    WHERE MenuItemId = @MenuItemId  
     
     IF(@PageParentId IS NULL)  
      BEGIN  
      UPDATE MenuItems SET IdPath = CAST(@MenuItemId as nvarchar(20)), PageLevel = 1  WHERE MenuItemId = @MenuItemId      
      END  
     ELSE  
      BEGIN  
      SELECT @IdPath = IdPath, @PageLevel = PageLevel + 1 FROM MenuItems WHERE MenuItemId = @PageParentId  
      UPDATE MenuItems SET IdPath = @IdPath + '/' + CAST(@MenuItemId as nvarchar(20)), PageLevel = @PageLevel WHERE MenuItemId = @MenuItemId          
      END  
    
          
     end
       end  
     if(@AddPage='New Menu Item')  
   BEGIN  
    INSERT INTO MenuItems VALUES  
      (@ChapterId  
      ,@DisplayName   
      ,NULL  
      ,@PageParentId  
      ,NULL   
      ,@Position  
      ,@IsTopBar  
      ,@IsMenuBar  
      ,@IsQuickLinks  
      ,@IsFooterBar  
      ,@IsActive  
      ,@UpdatedBy  
      ,@UpdatedDate  
      ,@InsertedBy  
      ,@InsertedDate)  
      
     SELECT @MenuItemId =  SCOPE_IDENTITY()  
      
     IF(@PageParentId IS NULL)  
      BEGIN  
      UPDATE MenuItems SET IdPath = CAST(@MenuItemId as nvarchar(20)), PageLevel = 1  WHERE MenuItemId = @MenuItemId      
      END  
     ELSE  
      BEGIN  
      SELECT @IdPath = IdPath, @PageLevel = PageLevel + 1 FROM MenuItems WHERE MenuItemId = @PageParentId  
      UPDATE MenuItems SET IdPath = @IdPath + '/' + CAST(@MenuItemId as nvarchar(20)), PageLevel = @PageLevel WHERE MenuItemId = @MenuItemId          
      END  
  
      INSERT INTO MenuPages VALUES  
       (@MenuItemId  
       ,@PageDetailId)   
          

  end
     if(@AddPage='Existing Menu')  
   BEGIN  
     
      INSERT INTO MenuPages VALUES  
       (@ExistingMenuItemId  
       ,@PageDetailId)   
   End 
end 
  SELECT @QStatus = 2;
  
  
     
     
  end  
      
        
     
      


   
   
  --  COMMIT TRANSACTION  
  --  END TRY  
      
  --  BEGIN CATCH      
  --  ROLLBACK TRANSACTION  
  --SELECT @QStatus = -1;      
  --  END CATCH      

  
  
  
  
  
  
  
  
  
  



GO
/****** Object:  StoredProcedure [dbo].[PageDetailsUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[PageDetailsUpdateStatus]
    (@PageDetailId bigint
    ,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		BEGIN TRANSACTION
			IF((SELECT IsActive FROM PageDetails WHERE PageDetailId = @PageDetailId) = 1)
				BEGIN
					UPDATE PageDetails SET IsActive = 0 WHERE PageDetailId = @PageDetailId
				END
			ELSE
				BEGIN
					UPDATE PageDetails SET IsActive = 1 WHERE PageDetailId = @PageDetailId
				END		
			SELECT @QStatus = 1;
		COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END
 









GO
/****** Object:  StoredProcedure [dbo].[PaymentMethodsGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[PaymentMethodsGetListByVariable]
	 (@Search nvarchar(126)
	 ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)
            
AS
BEGIN
	
	SET NOCOUNT ON;
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
    
    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
				,PaymentMethodId bigint
				,PaymentMethod nvarchar(156)
				,IsActive bit)
	
	SELECT @Start = (@PageNo - 1) * @Items     
	SELECT @End = @Start + @Items 
	
	SET @Query = 'INSERT INTO #temp 
		 SELECT  P.PaymentMethodId
				,P.PaymentMethod
                ,P.IsActive  
				FROM PaymentMethods P 
				WHERE P.PaymentMethodId <> 0'
	
	
	IF(@Search <> '')
		BEGIN
			SET @Query = @Query + ' AND ( P.PaymentMethod LIKE ''%' + @Search + '%'' )'
		END
	
	IF(@Sort <> '')
		BEGIN
			SET @Query = @Query + ' ORDER BY ' + @Sort
		END
	
    EXEC sp_ExecuteSQL @Query;
	
	SELECT @Total = COUNT(Rid) from #temp 
			
	SELECT *  FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
	DROP TABLE #temp

END










GO
/****** Object:  StoredProcedure [dbo].[PaymentMethodsList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[PaymentMethodsList]
    @QStatus int output
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		SELECT * FROM PaymentMethods WHERE IsActive=1
		SELECT @QStatus = 1;	
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END





















GO
/****** Object:  StoredProcedure [dbo].[PaymentMethodsUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[PaymentMethodsUpdateStatus]
    (@PaymentMethodId bigint
    ,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;

    BEGIN TRY    
    BEGIN TRANSACTION
    
		IF((SELECT IsActive FROM PaymentMethods WHERE PaymentMethodId = @PaymentMethodId) = 1)
			BEGIN
				UPDATE PaymentMethods SET IsActive = 0 WHERE PaymentMethodId = @PaymentMethodId
			END
		ELSE
			BEGIN
				UPDATE PaymentMethods SET IsActive = 1 WHERE PaymentMethodId = @PaymentMethodId
			END		
		
		SELECT @QStatus = 1;
		
	COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END











GO
/****** Object:  StoredProcedure [dbo].[PaymentSettingsChangeStatusById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[PaymentSettingsChangeStatusById]
(@PaymentSettingId bigint,
 @QStatus bigint OUTPUT)
 
 AS
 BEGIN
 
	SET NOCOUNT ON;
    BEGIN TRY    
		
		UPDATE PaymentSettings SET IsActive = 0 WHERE PaymentMethodId=(SELECT top(1) PaymentMethodId FROM PaymentSettings WHERE PaymentSettingId =@PaymentSettingId)
		
		IF((SELECT IsActive FROM PaymentSettings WHERE PaymentSettingId =@PaymentSettingId) =0)
			BEGIN
				UPDATE PaymentSettings SET IsActive = 1 WHERE PaymentSettingId =@PaymentSettingId 
			END
		ELSE
			BEGIN
				UPDATE PaymentSettings SET IsActive = 0 WHERE PaymentSettingId =@PaymentSettingId 
			END
		
		SELECT @QStatus = 1;
		
    END TRY
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
	
	END























GO
/****** Object:  StoredProcedure [dbo].[PaymentSettingsDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[PaymentSettingsDelete]
    (@PaymentSettingId bigint
    ,@QStatus int output )  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		DELETE FROM PaymentSettings WHERE PaymentSettingId = @PaymentSettingId	    
		SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END






























GO
/****** Object:  StoredProcedure [dbo].[PaymentSettingsGetDetails]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[PaymentSettingsGetDetails]
    (@PaymentSettingId BIGINT
    ,@PaymentMethod nvarchar(512)
    ,@QStatus int OUTPUT)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY
		IF(@PaymentMethod <> '')
			BEGIN			
				SELECT * FROM PaymentSettings PS INNER JOIN CurrencyCodes CC ON CC.CurrencyCodeId=PS.CurrencyCodeId 
				INNER JOIN PaymentMethods PM ON PM.PaymentMethodId=PS.PaymentMethodId WHERE PM.PaymentMethod=@PaymentMethod AND PS.IsActive=1
			END
		IF(@PaymentSettingId <> 0)
			BEGIN
				SELECT * FROM PaymentSettings PS INNER JOIN CurrencyCodes CC ON CC.CurrencyCodeId=PS.CurrencyCodeId 
				INNER JOIN PaymentMethods PM ON PM.PaymentMethodId=PS.PaymentMethodId WHERE PS.PaymentSettingId=@PaymentSettingId 
			END
        SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH    
		SELECT @QStatus = -1;    
    END CATCH
    
END





































GO
/****** Object:  StoredProcedure [dbo].[PaymentSettingsGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[PaymentSettingsGetListByVariable]
     @search nvarchar(500)
    ,@PageNo int
    ,@ItemsPerPage int
    ,@Total int output
        
AS
BEGIN
	
	 DECLARE @Query nvarchar(max);
	 DECLARE @Start int, @End INT ;
    
     SET NOCOUNT ON;

	 BEGIN TRY
	 CREATE TABLE #temp(RId INT PRIMARY KEY IDENTITY(1,1)
			,PaymentSettingId int
			,PaymentMethodId bigint
			,PaymentMethod nvarchar(256)
			,PaymentUrl nvarchar(256)
			,PaymentEmail nvarchar(128)
			,PaymentPassword nvarchar(256)
			,CurrencyCodeId bigint
			,CurrencyCode nvarchar(256)
			,SuccessUrl nvarchar(256)
			,CancelUrl nvarchar(256)
			,NotifyUrl nvarchar(256)
			,TokenNo nvarchar(128)
			,AccountType nvarchar(30)
			,IsActive bit)
      
			SELECT @Start = (@PageNo - 1) * @ItemsPerPage     
			SELECT @End = @Start + @ItemsPerPage 
    
			SET @Query = 'INSERT INTO #temp SELECT
					 PS.PaymentSettingId 
					,PS.PaymentMethodId 
					,PM.PaymentMethod
					,PS.PaymentUrl 
					,PS.PaymentEmail 
					,PS.PaymentPassword 
					,PS.CurrencyCodeId 
					,CC.CurrencyCode
					,PS.SuccessUrl 
					,PS.CancelUrl 
					,PS.NotifyUrl 
					,PS.TokenNo 
					,PS.AccountType 
					,PS.IsActive
			        FROM PaymentSettings PS INNER JOIN CurrencyCodes CC ON CC.CurrencyCodeId=PS.CurrencyCodeId 
				    INNER JOIN PaymentMethods PM ON PM.PaymentMethodId=PS.PaymentMethodId WHERE PS.PaymentSettingId != 0' 
       
		    IF(@search<>'')
				BEGIN
					SET @Query=@Query + ' AND PM.PaymentMethod LIKE ''%' + @search + '%'''
				END

			EXEC sp_ExecuteSQL @Query;

			SELECT @Total = COUNT(RId) from #temp
		
			SELECT   RId
					,PaymentSettingId 
					,PaymentMethodId 
					,PaymentMethod
					,PaymentUrl 
					,PaymentEmail 
					,PaymentPassword 
					,CurrencyCodeId 
					,CurrencyCode
					,SuccessUrl 
					,CancelUrl 
					,NotifyUrl 
					,TokenNo 
					,AccountType 
					,IsActive
			        FROM #temp WHERE RId > @Start AND RId <=@End       
		   DROP TABLE #temp  
	 END TRY

	 BEGIN CATCH
	    SELECT @Total=-1;
	 END CATCH

END











GO
/****** Object:  StoredProcedure [dbo].[PaymentSettingsInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[PaymentSettingsInsert]
    (@PaymentSettingId int
    ,@PaymentMethodId bigint
    ,@PaymentUrl nvarchar(256)
    ,@PaymentEmail nvarchar(128)
    ,@PaymentPassword nvarchar(256)
    ,@CurrencyCodeId bigint
    ,@SuccessUrl nvarchar(256)
    ,@CancelUrl nvarchar(256)
    ,@NotifyUrl nvarchar(256)
    ,@TokenNo nvarchar(128)
    ,@AccountType nvarchar(30)
	,@Qstatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY
    
    IF((SELECT COUNT(*) FROM PaymentSettings WHERE PaymentSettingId = @PaymentSettingId) = 0)
		BEGIN
			INSERT INTO PaymentSettings VALUES
				 (@PaymentMethodId
				 ,@PaymentUrl 
				 ,@PaymentEmail 
				 ,@PaymentPassword 
				 ,@CurrencyCodeId 
				 ,@SuccessUrl 
				 ,@CancelUrl 
				 ,@NotifyUrl 
				 ,@TokenNo 
				 ,@AccountType
				 ,0)		
			
			SELECT @Qstatus = 1;	
		END
	ELSE
		BEGIN
			UPDATE PaymentSettings
			   SET 
				  PaymentUrl		=	@PaymentUrl
				 ,PaymentMethodId	=	@PaymentMethodId
				 ,PaymentEmail		=	@PaymentEmail
				 ,PaymentPassword	=	@PaymentPassword
				 ,CurrencyCodeId	=	@CurrencyCodeId 
				 ,SuccessUrl		=	@SuccessUrl
				 ,CancelUrl			=	@CancelUrl
				 ,NotifyUrl			=	@NotifyUrl
				 ,TokenNo			=	@TokenNo
				 ,AccountType		=	@AccountType
		    WHERE PaymentSettingId  =	@PaymentSettingId
		 		 
			 SELECT @Qstatus = 2;	
		END
    END TRY
    
    BEGIN CATCH    
		SELECT @Qstatus = -1;    
    END CATCH
    
    
END











GO
/****** Object:  StoredProcedure [dbo].[PaymentStatusList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[PaymentStatusList]
    @QStatus int output
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		SELECT * FROM PaymentStatus WHERE PaymentStatus IN ('Completed','Pending','Success') AND IsActive=1
		SELECT @QStatus = 1;	
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END





















GO
/****** Object:  StoredProcedure [dbo].[ProfileEmailUpdate]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ProfileEmailUpdate]
    (@MemberId bigint
    ,@Email nvarchar(128)
	,@QStatus int output)  
	    
AS
BEGIN
	
	SET NOCOUNT ON;

    BEGIN TRY    
	    Declare @PEmail nvarchar(512);

		SET @PEmail = (Select Email from Members WHERE MemberId = @MemberId)
    
		UPDATE Members SET Email = @Email WHERE MemberId = @MemberId

		Update Users
		       SET   Email = @Email 
			   Where Email = @PEmail	  
		
	    SELECT @QStatus = 1;		
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END
































GO
/****** Object:  StoredProcedure [dbo].[RedirectionsDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[RedirectionsDelete]
    (@RedirectionId bigint
    ,@QStatus int output )  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY  
		BEGIN TRANSACTION  
			DELETE FROM Redirections WHERE RedirectionId = @RedirectionId		
			SELECT @QStatus = 1;
		COMMIT TRANSACTION		
    END TRY

    BEGIN CATCH
		ROLLBACK TRANSACTION
		SELECT @QStatus = -1;
    END CATCH
    	
END
 














GO
/****** Object:  StoredProcedure [dbo].[RedirectionsGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[RedirectionsGetList]
    @QStatus int output
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY
		SELECT * FROM Redirections	WHERE IsActive=1
		SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END
 














GO
/****** Object:  StoredProcedure [dbo].[RedirectionsGetListById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[RedirectionsGetListById]
	 (@RedirectionId bigint
     ,@QStatus int output)
AS
BEGIN
	
	SET NOCOUNT ON;
	
	BEGIN TRY
		DECLARE @Query nvarchar(max);
   
		IF(@RedirectionId<>0)
			BEGIN
				 SELECT  * FROM Redirections WHERE RedirectionId= @RedirectionId		
			END
		SELECT @QStatus = 1; 	
	END TRY
    
    BEGIN CATCH  
       SELECT @QStatus = -1; 		   
    END CATCH   
END
 














GO
/****** Object:  StoredProcedure [dbo].[RedirectionsGetListByUrl]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[RedirectionsGetListByUrl]
	 (@Url nvarchar(512)
     ,@QStatus int output)
AS
BEGIN
	
	SET NOCOUNT ON;
	
	BEGIN TRY
		DECLARE @Query nvarchar(max);
		IF(@Url<>'')
			BEGIN
			   SELECT  * FROM Redirections WHERE FromUrl= @Url	
			END
		SELECT @QStatus = 1; 	
	END TRY
    
    BEGIN CATCH  
       SELECT @QStatus = -1; 		   
    END CATCH   
END
 














GO
/****** Object:  StoredProcedure [dbo].[RedirectionsGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[RedirectionsGetListByVariable]
	 (@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)
AS
BEGIN
	
	SET NOCOUNT ON;
	
	BEGIN TRY
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
    
    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
				,RedirectionId bigint
				,FromUrl nvarchar(max)
				,ToUrl nvarchar(max)
				,Target nvarchar(512)
				,IsActive bit
				,Field1 nvarchar(512)
				,Field2 nvarchar(512)
				,InsertedBy nvarchar(128)
				,InsertedDate datetime
				,UpdatedBy nvarchar(128)
				,UpdatedDate datetime)

				
	SELECT @Start = (@PageNo - 1) * @Items  
	   
	SELECT @End = @Start + @Items 
	
	SET @Query = 'INSERT INTO #temp  SELECT 
		         R.RedirectionId 
				,R.FromUrl
				,R.ToUrl
				,R.Target 
				,R.IsActive 
				,R.Field1 
				,R.Field2 
				,R.InsertedBy 
				,R.InsertedDate 
				,R.UpdatedBy 
				,R.UpdatedDate 
				FROM Redirections R		
				WHERE R.RedirectionId <> 0 '
		
		
		IF(@Search <> '')
		BEGIN
			SET @Query = @Query + ' AND  R.FromUrl LIKE ''%' + @Search + '%'' OR R.ToUrl LIKE ''%' + @Search + '%'''
		END

		IF(@Sort <> '')
		BEGIN
			SET @Query = @Query + ' ORDER BY ' + @Sort
		END
	
		EXEC sp_ExecuteSQL @Query;
		
	    SELECT @Total = COUNT(Rid) from #temp 
				
		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
		DROP TABLE #temp
	END TRY
    
    BEGIN CATCH  
       SELECT @Total = -1; 		   
    END CATCH   
END
 













GO
/****** Object:  StoredProcedure [dbo].[RedirectionsInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[RedirectionsInsert]
    (@RedirectionId bigint
    ,@FromUrl nvarchar(max)
    ,@ToUrl nvarchar(max)
    ,@Target nvarchar(512)
    ,@IsActive bit
	,@Field1 nvarchar(512)
	,@Field2 nvarchar(512)
	,@InsertedBy nvarchar(128)
    ,@InsertedDate datetime
	,@UpdatedBy nvarchar(128)
    ,@UpdatedDate datetime
	,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY
		BEGIN TRANSACTION
		IF((SELECT COUNT(*) FROM Redirections WHERE RedirectionId = @RedirectionId) = 0)
			BEGIN
				INSERT INTO Redirections VALUES
					(@FromUrl
					,@ToUrl
					,@Target 
					,@IsActive 
					,@Field1 
					,@Field2 
					,@InsertedBy 
					,@InsertedDate 
					,@UpdatedBy 
					,@UpdatedDate)		
			
				SELECT @QStatus = 1;	
			END
		ELSE
			BEGIN
				UPDATE Redirections
				   SET 
					  FromUrl=@FromUrl
					 ,ToUrl=@ToUrl
					 ,Target=@Target
					 ,IsActive=@IsActive
					 ,Field1=@Field1
					 ,Field2=@Field2
					 ,InsertedBy=@InsertedBy
					 ,InsertedDate=@InsertedDate
					,UpdatedDate=@UpdatedDate 
					,UpdatedBy =@UpdatedBy 
	
				 WHERE RedirectionId = @RedirectionId
		 		 
				 SELECT @QStatus = 2;	
			END
		COMMIT TRANSACTION
    END TRY
    
    BEGIN CATCH    
		ROLLBACK TRANSACTION
		SELECT @QStatus = -1;    
    END CATCH    
END
 














GO
/****** Object:  StoredProcedure [dbo].[RedirectionsUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[RedirectionsUpdateStatus]
    (@RedirectionId  bigint
    ,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		BEGIN TRANSACTION
    
			IF((SELECT IsActive FROM Redirections WHERE RedirectionId  = @RedirectionId ) = 1)
				BEGIN
					UPDATE Redirections SET IsActive = 0 WHERE RedirectionId  = @RedirectionId 
				END
			ELSE
				BEGIN
					UPDATE Redirections SET IsActive = 1 WHERE RedirectionId  = @RedirectionId 
				END		
		
			SELECT @QStatus = 1;
		
		COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END
 














GO
/****** Object:  StoredProcedure [dbo].[RemoveRoleAccess]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[RemoveRoleAccess]
	(@QStatus int OUTPUT
	,@UserRoleId bigint
	,@ParentId bigint)    
        
AS
BEGIN
	
   SET NOCOUNT ON;

    BEGIN TRY 

	DECLARE @UserId bigint;
	SET @UserId = (SELECT UserId FROM UserRoles WHERE UserRoleId = @UserRoleId);

	DECLARE @count int;
	SET @count = (SELECT COUNT(*) FROM UserRoles where RoleId IN (SELECT RoleId FROM Roles WHERE ParentId = @ParentId) AND UserId = @UserId);

	IF(@count > 1)
	BEGIN
	DELETE UserRoles WHERE UserRoleId = @UserRoleId;
	END
	ELSE
	BEGIN
	DELETE UserRoles WHERE UserRoleId = @UserRoleId;
	DELETE UserRoles WHERE RoleId = @ParentId AND UserId = @UserId;
	END

		
		 SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END








GO
/****** Object:  StoredProcedure [dbo].[RequestTranscriptDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[RequestTranscriptDelete]
    (@RequestTranscriptId bigint
    ,@QStatus int output )  
        
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY  
		    BEGIN TRANSACTION  
			DELETE FROM RequestTranscript WHERE RequestTranscriptId = @RequestTranscriptId		
			SELECT @QStatus = 1;
			COMMIT TRANSACTION		
    END TRY

    BEGIN CATCH
    ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END














GO
/****** Object:  StoredProcedure [dbo].[RequestTranscriptGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[RequestTranscriptGetById]
	(@RequestTranscriptId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	
   SET NOCOUNT ON;

    BEGIN TRY 
		 SELECT * from RequestTranscript where RequestTranscriptId	=	@RequestTranscriptId
		 
		 SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END











GO
/****** Object:  StoredProcedure [dbo].[RequestTranscriptGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[RequestTranscriptGetListByVariable] 
	 (@FromDate nvarchar(126)
	 ,@ToDate nvarchar(126)
	 ,@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
    --Sp_help RequestTranscript

    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
				,RequestTranscriptId	bigint
				,FullName	nvarchar(128)
				,FormerName	nvarchar(128)
				,PhoneNo	nvarchar(128)
				,Email	nvarchar(128)
				,SSN	nvarchar(128)
				,DOB	datetime
				,ProgramAttended	nvarchar(512)
				,PreviousAttended	nvarchar(512)
				,Address	nvarchar(max)
				,City	nvarchar(128)
				,State	nvarchar(128)
				,ZipCode	nvarchar(128)
				,TranscriptRequest	nvarchar(128)
				,IsActive	bit
				,InsertedBy	nvarchar(512)
				,InsertedDate	datetime
				,UpdatedBy	nvarchar(512)
				,UpdatedDate	datetime
				)
				
	SELECT @Start = (@PageNo - 1) * @Items  
	   
	SELECT @End = @Start + @Items 
	
	SET @Query = 'INSERT INTO #temp SELECT 
	                RT.RequestTranscriptId
					,RT.FullName
					,RT.FormerName
					,RT.PhoneNo
					,RT.Email
					,RT.SSN
					,RT.DOB
					,RT.ProgramAttended
					,RT.PreviousAttended
					,RT.Address
					,RT.City
					,RT.State
					,RT.ZipCode
					,RT.TranscriptRequest
					,RT.IsActive
					,RT.InsertedBy
					,RT.InsertedDate
					,RT.UpdatedBy
					,RT.UpdatedDate

				FROM RequestTranscript RT
		        WHERE RT.RequestTranscriptId <> 0 '

	
		IF(@Search <> '')
			BEGIN
				--SET @Query = @Query + ' AND  RT.FullName LIKE ''%' + @Search + '%'''
				SET @Query = @Query + ' AND (RT.FullName LIKE ''%' + @Search + '%'' OR RT.FormerName LIKE ''%' + @Search + '%'' OR RT.Email LIKE ''%' + @Search + '%'')'    
			END

	

	IF(@FromDate <> '' OR @ToDate <> '')
		BEGIN
			IF(@FromDate <> '' AND @ToDate <> '')
				BEGIN
				Set @Query = @Query + ' AND Convert(Date, RT.InsertedDate) Between CONVERT(date,'''+@FromDate+''',103) AND CONVERT(date,'''+@ToDate+''',103)'

					--SET @Query = @Query + ' AND  (Convert(Date, RT.InsertedDate) >= ''' + @FromDate + ''' AND Convert(Date, RT.InsertedDate) <= ''' + @ToDate + ''')'
				END 

			IF(@FromDate <> '' AND @ToDate = '')
				BEGIN
					SET @Query = @Query + ' AND CONVERT(date,  RT.InsertedDate) >= CONVERT(date,'''+@FromDate+''',103)'

					--SET @Query = @Query + ' AND  Convert(Date,RT.InsertedDate) >= ''' + @FromDate + ''''
				END 
			IF(@FromDate = '' AND @ToDate <> '')
				BEGIN
					SET @Query = @Query + ' AND CONVERT(date,  RT.InsertedDate) <= CONVERT(date,'''+@ToDate+''',103)' 

					--SET @Query = @Query + ' AND Convert(Date, AN.InsertedDate) <= ''' + @ToDate + ''''
				END
	    END 


		IF(@Sort <> '')
			BEGIN
				SET @Query = @Query + ' ORDER BY ' + @Sort
			END
	
		EXEC sp_ExecuteSQL @Query;
		
		SELECT @Total = COUNT(Rid) from #temp 
				
		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
		DROP TABLE #temp
 
END












GO
/****** Object:  StoredProcedure [dbo].[RequestTranscriptInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[RequestTranscriptInsert]
    (@RequestTranscriptId bigint output
	,@FullName nvarchar(128)
	,@FormerName nvarchar(128)
	,@PhoneNo nvarchar(128)
	,@Email nvarchar(128)
	,@SSN nvarchar(128)
	,@DOB datetime
	,@ProgramAttended nvarchar(1024)
	,@PreviousAttended nvarchar(1024)
	,@Address nvarchar(1024)
	,@City nvarchar(128)
	,@State nvarchar(128)
	,@ZipCode nvarchar(128)
	,@TranscriptRequest nvarchar(1024)
	,@DocumentSent nvarchar(128)
	,@Description nvarchar(1024)
	,@Signature nvarchar(128)
	,@CheckBox1 bit
	,@CheckBox2 bit
	,@IpAddress nvarchar(128)
	,@InsertedBy nvarchar(1024)
	,@UpdatedBy	nvarchar(1024)
	,@QStatus int output)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY
    BEGIN TRANSACTION
    IF((SELECT COUNT(*) FROM RequestTranscript WHERE Email = @Email) = 0)
    BEGIN

        INSERT INTO RequestTranscript VALUES

            (@FullName
			,@FormerName
			,@PhoneNo
			,@Email
			,@SSN
			,@DOB
			,@ProgramAttended
			,@PreviousAttended
			,@Address
			,@City
			,@State
			,@ZipCode
			,@TranscriptRequest
			,@DocumentSent
			,@Description
			,@Signature
			,@CheckBox1
			,@CheckBox2
			,1
			,@IpAddress
			,@InsertedBy
			,(Convert(DateTime, SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')))
			,@UpdatedBy
			,(Convert(DateTime, SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')))
			)		

			SELECT @RequestTranscriptId = SCOPE_IDENTITY()
			
		SELECT @QStatus = 1;	
	END
	ELSE
	BEGIN
		UPDATE RequestTranscript

		    SET	 FullName	=	@FullName
				,FormerName	=	@FormerName
				,PhoneNo	=	@PhoneNo
				,Email	=	@Email
				,SSN	=	@SSN
				,DOB	=	@DOB
				,ProgramAttended	=	@ProgramAttended
				,PreviousAttended	=	@PreviousAttended
				,Address	=	@Address
				,City	=	@City
				,State	= @State
				,ZipCode	=	@ZipCode
				,TranscriptRequest	=	@TranscriptRequest
				,DocumentSent	=	@DocumentSent
				,Description	=	@Description
				,Signature	=	@Signature
				,CheckBox1	=	@CheckBox1
				,CheckBox2	=	@CheckBox2
				,IsActive	=	1
				,IpAddress	=	@IpAddress
				,UpdatedBy	= @UpdatedBy
				,UpdatedDate =	(Convert(DateTime, SWITCHOFFSET(SYSDATETIMEOFFSET(), '+05:30')))

		 WHERE RequestTranscriptId = @RequestTranscriptId
		 		 
		 SELECT @QStatus = 1;	
	END
    COMMIT TRANSACTION
    END TRY
    
    BEGIN CATCH    
    ROLLBACK TRANSACTION
		SELECT @QStatus = -1;    
    END CATCH    
END


















GO
/****** Object:  StoredProcedure [dbo].[RequestTranscriptUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[RequestTranscriptUpdateStatus]
    (@RequestTranscriptId bigint
    ,@QStatus int output)  
        
AS
BEGIN


	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		BEGIN TRANSACTION

			IF((SELECT IsActive FROM RequestTranscript WHERE RequestTranscriptId = @RequestTranscriptId) = 1)
				BEGIN
					UPDATE RequestTranscript SET IsActive = 0 WHERE RequestTranscriptId = @RequestTranscriptId
				END
			ELSE
				BEGIN
					UPDATE RequestTranscript SET IsActive = 1 WHERE RequestTranscriptId = @RequestTranscriptId
				END		
		
			SELECT @QStatus = 1;
		
		COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
    
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
		 
    END CATCH
    	
END










GO
/****** Object:  StoredProcedure [dbo].[RoleBasedMenuGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[RoleBasedMenuGetById]
	(@UserId bigint
	,@RoleName nvarchar(512)
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	SET NOCOUNT ON;

   BEGIN TRY 

	   DECLARE @RoleId bigint;
	   SET @RoleId = (SELECT RoleId FROM Roles WHERE RoleName = @RoleName);

	   SELECT * FROM UserRoles WHERE RoleId = @RoleId AND UserId = @UserId;

	   SELECT @QStatus = 1;
		
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH		
	 
END











GO
/****** Object:  StoredProcedure [dbo].[SaveFormSchema]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[SaveFormSchema]
    ( @FormName NVARCHAR(255),
    @Schema NVARCHAR(MAX),
	@FormId bigint,
	@QStatus int output) -- Accept the full schema (containing multiple fields))  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	
	    SET NOCOUNT ON;

	
		IF((SELECT COUNT(*) FROM FormSchemas WHERE FormId = @FormId) = 0)
				BEGIN
					INSERT INTO FormSchemas VALUES
							(@FormName
							,1
							,'Admin'
							,GETUTCDATE()
							,@Schema)
							SELECT @FormId =  SCOPE_IDENTITY()
			 
					
					 SELECT @QStatus = 1;	
				END

		ELSE
				BEGIN
					UPDATE FormSchemas
					   SET  FormName = @FormName
						   ,FormSchema=@Schema 
						  
					WHERE FormId = @FormId
			
				
					SELECT @QStatus = 2;	
				END
END



GO
/****** Object:  StoredProcedure [dbo].[ScholorshipRegistrationsExportToExcel]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ScholorshipRegistrationsExportToExcel] 
	 (@Total int OUTPUT)
        
AS
BEGIN

	   BEGIN TRY 
	
			SET NOCOUNT ON;
			
			DECLARE @Start int, @End INT ;
			DECLARE @Query nvarchar(max);

			SET @Query = '
				  SELECT Distinct
				   id
	              ,user_id
				  ,firstname
				  ,lastname
				  ,email
				  ,phone
				  ,gender
				  ,address
				  ,city
				  ,state
				  ,zipcode
				  ,student_status
				  ,graduation_year
				  ,dob
				  ,education_goals
				  ,gpa
				  ,stmt_question
				  ,stmt_answer
				  ,agree_check
				  ,signature
				  ,regdate
				  ,activation
				  ,status
				  ,ip
	              FROM nats_scholarship_users WHERE id <> 0'
				 
			EXEC sp_ExecuteSQL @Query;
			SELECT @Total = 1;
			
		END TRY

		BEGIN CATCH
			 SELECT @Total = -1;
		END CATCH
	 
END








GO
/****** Object:  StoredProcedure [dbo].[ServiceCategoriesDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ServiceCategoriesDelete]
    (@ServiceCategoryId bigint
    ,@QStatus int output )  
        
	AS
	BEGIN
	
		SET NOCOUNT ON;

		BEGIN TRY    
			BEGIN TRANSACTION
				DELETE FROM ServiceCategories WHERE ServiceCategoryId = @ServiceCategoryId		
				SELECT @QStatus = 1;		
			COMMIT TRANSACTION

		END TRY

		BEGIN CATCH
			ROLLBACK TRANSACTION
			 SELECT @QStatus = -1;
		END CATCH
    	
	END










GO
/****** Object:  StoredProcedure [dbo].[ServiceCategoriesGetByChapterId]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServiceCategoriesGetByChapterId]
	(@ChapterId bigint
    ,@QStatus int OUTPUT)    
        
	AS
	BEGIN
	
	   SET NOCOUNT ON;

		BEGIN TRY 
    
			 SELECT * from ServiceCategories where ChapterId=@ChapterId
			 SELECT @QStatus = 1;
		 
		END TRY
    
		BEGIN CATCH
			 SELECT @QStatus = -1;
		 END CATCH	
	 
	END











GO
/****** Object:  StoredProcedure [dbo].[ServiceCategoriesGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServiceCategoriesGetById]
	(@ServiceCategoryId bigint
    ,@QStatus int OUTPUT)    
        
	AS
	BEGIN

	   SET NOCOUNT ON;

		BEGIN TRY 
    
			 SELECT * from ServiceCategories where ServiceCategoryId=@ServiceCategoryId
			 SELECT @QStatus = 1;
		 
		END TRY
    
		BEGIN CATCH
			 SELECT @QStatus = -1;
		END CATCH	
	 
	END










GO
/****** Object:  StoredProcedure [dbo].[ServiceCategoriesGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ServiceCategoriesGetList]
	(@QStatus int OUTPUT)    
        
	AS
	BEGIN

	   SET NOCOUNT ON;

		BEGIN TRY 
    
			 SELECT * FROM ServiceCategories
			 SELECT @QStatus = 1;
		 
		END TRY
    
		BEGIN CATCH
			 SELECT @QStatus = -1;
		END CATCH	
	 
	END












GO
/****** Object:  StoredProcedure [dbo].[ServiceCategoriesGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServiceCategoriesGetListByVariable] 
	 (@ChapterId bigint
	 ,@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)


	AS
	BEGIN

		SET NOCOUNT ON;
	
		BEGIN TRY
	
				DECLARE @Start int, @End INT ;
				DECLARE @Query nvarchar(max);
	
				CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
							,ServiceCategoryId bigint
							,ChapterId bigint
							,CategoryName nvarchar(512)
							,IconUrl nvarchar(512)
							,IsActive bit	
							,UpdatedBy nvarchar(128)	
							,UpdatedDate datetime
							,ChapterName nvarchar(512))
				
				SELECT @Start = (@PageNo - 1) * @Items  
	   
				SELECT @End = @Start + @Items 
	
				SET @Query = 'INSERT INTO #temp SELECT
						 IC.ServiceCategoryId
						,IC.ChapterId
						,IC.CategoryName
						,IC.IconUrl
						,IC.IsActive
						,IC.UpdatedBy
						,IC.UpdatedDate
						,C.ChapterName
						 FROM ServiceCategories IC  	
						 INNER JOIN Chapters C ON C.ChapterId = IC.ChapterId 	
						 WHERE IC.ServiceCategoryId <> 0 '
		
		

				IF(@ChapterId <> 0)
				BEGIN
					SET @Query=@Query + 'AND IC.ChapterId = ' + CAST(@ChapterId AS nvarchar(30))
				END  

				IF(@Search <> '')
				BEGIN
					SET @Query = @Query + ' AND  IC.CategoryName LIKE ''%' + @Search + '%'''
				END
				
				IF(@Sort <> '')
				BEGIN
					SET @Query = @Query + ' ORDER BY ' + @Sort
				END
	
				EXEC sp_ExecuteSQL @Query;
		
				SELECT @Total = COUNT(Rid) from #temp 
				
				SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
				DROP TABLE #temp

		END TRY
    
		BEGIN CATCH  
		   SELECT @Total = -1; 		   
		END CATCH   

	END



















GO
/****** Object:  StoredProcedure [dbo].[ServiceCategoriesInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServiceCategoriesInsert]
    (@ServiceCategoryId bigint
	,@ChapterId bigint
	,@CategoryName nvarchar(512)
	,@IconUrl nvarchar(256)
	,@IsActive bit
	,@UpdatedDate datetime
	,@UpdatedBy nvarchar(128)
	,@QStatus int output)  
        
	AS
	BEGIN

		SET NOCOUNT ON;

		BEGIN TRY
		BEGIN TRANSACTION

		IF((SELECT COUNT(*) FROM ServiceCategories WHERE ServiceCategoryId = @ServiceCategoryId) = 0)
			BEGIN
				INSERT INTO ServiceCategories VALUES
					(@ChapterId
					,@CategoryName
					,Null
					,@IsActive
					,@UpdatedDate
					,@UpdatedBy)		
			
				SELECT @QStatus = 1;	
			END
		ELSE
			BEGIN
				UPDATE ServiceCategories
				   SET
					  ChapterId=@ChapterId 
					 ,CategoryName = @CategoryName
					 ,UpdatedBy=@UpdatedBy
					 ,UpdatedDate=@UpdatedDate
				      WHERE ServiceCategoryId = @ServiceCategoryId
		 		 
				    SELECT @QStatus = 2;	
			END
			 
		COMMIT TRANSACTION
		END TRY
    
		BEGIN CATCH    
		ROLLBACK TRANSACTION
			SELECT @QStatus = -1;    
		END CATCH    

	END














GO
/****** Object:  StoredProcedure [dbo].[ServiceCategoriesUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServiceCategoriesUpdateStatus]
    (@ServiceCategoryId bigint
    ,@QStatus int output)  
        
	AS
	BEGIN

		SET NOCOUNT ON;
    
			BEGIN TRY    
			BEGIN TRANSACTION
    
				IF((SELECT IsActive FROM ServiceCategories WHERE ServiceCategoryId = @ServiceCategoryId) = 1)
					BEGIN
						UPDATE ServiceCategories SET IsActive = 0 WHERE ServiceCategoryId = @ServiceCategoryId
					END
				ELSE
					BEGIN
						UPDATE ServiceCategories SET IsActive = 1 WHERE ServiceCategoryId = @ServiceCategoryId
					END		
		
				SELECT @QStatus = 1;
		
			COMMIT TRANSACTION
			END TRY

			BEGIN CATCH
				 ROLLBACK TRANSACTION
				 SELECT @QStatus = -1;
			END CATCH
    	
	END











GO
/****** Object:  StoredProcedure [dbo].[ServiceImagesDefaultImage]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServiceImagesDefaultImage]

-- Add the parameters for the stored procedure here
@ServiceId bigint,
@ServiceImageId bigint,
@Qstatus bigint OUTPUT


AS
BEGIN

	SET NOCOUNT ON;

		BEGIN TRY
			UPDATE ServiceImages SET IsDefault = 0 WHERE ServiceImageId  = @ServiceImageId

			UPDATE ServiceImages SET IsDefault = 1 WHERE ServiceImageId = @ServiceImageId

			SELECT @Qstatus = 1
		END TRY

		BEGIN CATCH
			SELECT @Qstatus = -1
		END CATCH

END











GO
/****** Object:  StoredProcedure [dbo].[ServiceImagesDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ServiceImagesDelete]
    (@ServiceImageId bigint
    ,@QStatus int output )  
        
AS
BEGIN
	
	SET NOCOUNT ON;

    BEGIN TRY 
		DELETE FROM ServiceImages
		WHERE ServiceImageId = @ServiceImageId    
		
		SELECT @QStatus = 1;	
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END










GO
/****** Object:  StoredProcedure [dbo].[ServiceImagesGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServiceImagesGetById]
     @ServiceImageId bigint
    ,@QStatus int output    
        
AS
BEGIN

	  BEGIN TRY
	  SET NOCOUNT ON;

          SELECT 
				 S.ServiceImageId
				,S.ServiceId
				,I.ServiceTitle
				,S.ImageDescription
				,S.ImageUrl 
				,S.IsDefault 
			    FROM ServiceImages S INNER JOIN Services I ON S.ServiceId = I.ServiceId WHERE ServiceImageId = @ServiceImageId	

			 SELECT @QStatus=1
		END TRY

		BEGIN CATCH
		   SELECT @QStatus=-1
		END CATCH
END









GO
/****** Object:  StoredProcedure [dbo].[ServiceImagesGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ServiceImagesGetListByVariable]
		 @ServiceId bigint
		,@Total int output 
        
AS
BEGIN
	  BEGIN TRY  
			SELECT * FROM ServiceImages WHERE ServiceId=@ServiceId
			SELECT @Total=1
	  END TRY
		
	  BEGIN CATCH
		  SELECT @Total=-1
	  END CATCH
END











GO
/****** Object:  StoredProcedure [dbo].[ServiceImagesGetListByVariableee]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ServiceImagesGetListByVariableee]   
	  (@ServiceId bigint
	  ,@Search nvarchar(128)
      ,@Sort nvarchar(126)
	  ,@PageNo int
      ,@Items int
      ,@Total int output)
AS
BEGIN

	
	SET NOCOUNT ON;
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
	
    
		CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
							,ServiceImageId bigint
							,ServiceId bigint
							,ImageUrl nvarchar(512)
							,IsDefault bit
							,ImageDescription nvarchar(max)
							,UpdatedDate Datetime
							,UpdatedBy nvarchar(512))

		SELECT @Start = (@PageNo - 1) * @Items     
		SELECT @End = @Start + @Items 
	
		SET @Query = 'INSERT INTO #temp 
						SELECT 
						 E.ServiceImageId
						,E.ServiceId 
						,E.ImageUrl  
						,E.IsDefault
						,E.ImageDescription 
						,E.UpdatedDate
						,E.UpdatedBy
						 from ServiceImages E  WHERE E.ServiceImageId <> 0 '
	

		IF(@Search <> '')
			BEGIN
				SET @Query = @Query + ' AND (E.ImageDescription  LIKE ''%' + @Search + '%'' OR E.UpdatedBy  LIKE ''%' + @Search + '%'')'
			END

		    
		IF(@ServiceId<>0)
			BEGIN
				SET @Query=@Query + ' AND E.ServiceId='+cast(@ServiceId as nvarchar(max))
			END
	
		IF(@Sort <> '')
			BEGIN
				SET @Query = @Query + ' ORDER BY ' + @Sort
			END
	
		EXEC sp_ExecuteSQL @Query;
		Print @query
		SELECT @Total = COUNT(Rid) from #temp 
			
		SELECT *  FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
	  DROP TABLE #temp

END















GO
/****** Object:  StoredProcedure [dbo].[ServiceImagesInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServiceImagesInsert]
      (@ServiceImageId bigint
      ,@ServiceId bigint
      ,@ImageUrl nvarchar(128) output
	  ,@IsDefault bit
	  ,@ImageDescription nvarchar(1024)
      ,@UpdatedDate datetime
	  ,@UpdatedBy nvarchar(128)
	  ,@QStatus int output)  
        
AS
BEGIN

	SET NOCOUNT ON;

    BEGIN TRY


		DECLARE @ServiceTitle nvarchar(756)
		SET @ServiceTitle=(SELECT ServiceTitle FROM Services WHERE ServiceId=@ServiceId) 
    
		IF((SELECT COUNT(*) FROM ServiceImages WHERE ServiceImageId = @ServiceImageId) = 0)
			BEGIN
				INSERT INTO ServiceImages VALUES
					  (@ServiceId
					  ,NULL
					  ,@IsDefault
					  ,@ImageDescription
					  ,@UpdatedDate
					  ,@UpdatedBy)
			
				SET @ServiceImageId=SCOPE_IDENTITY();
					  
				SELECT @QStatus = 1;	
			 END

		 ELSE

			BEGIN
				UPDATE ServiceImages
				   SET  ServiceId=@ServiceId,
					   ImageDescription=@ImageDescription,
					   UpdatedDate=@UpdatedDate,
					   UpdatedBy=@UpdatedBy 
			   
				 WHERE ServiceImageId = @ServiceImageId

				 SELECT @QStatus = 2;	
			END


		IF(@ImageUrl <> 'NA')
			BEGIN
				UPDATE ServiceImages
					SET  ImageUrl= CAST(@ServiceImageId  AS nvarchar(12)) + '-' + dbo.RemoveSpecialChar(@ServiceTitle, '^a-z0-9') + '.' + @ImageUrl
					WHERE ServiceImageId = @ServiceImageId	
			  
					SELECT @ImageUrl = CAST(@ServiceImageId AS nvarchar(12)) + '-' + dbo.RemoveSpecialChar(@ServiceTitle, '^a-z0-9') + '.' + @ImageUrl	
			END	
		ELSE
			BEGIN
			  SELECT @ImageUrl=''
			END	

	 END TRY
    
		BEGIN CATCH    
			SELECT @QStatus = -1;    
		END CATCH
END











GO
/****** Object:  StoredProcedure [dbo].[ServiceImagesList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServiceImagesList]
    @QStatus int output
        
AS
BEGIN

	SET NOCOUNT ON;

    BEGIN TRY    
		SELECT * FROM ServiceImages	
		SELECT @QStatus = 1;	
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END











GO
/****** Object:  StoredProcedure [dbo].[ServicesDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ServicesDelete]
    (@ServiceId bigint
    ,@QStatus int output )  
        
AS
BEGIN
	
	SET NOCOUNT ON;

    
    BEGIN TRY  
    BEGIN TRANSACTION  
		DELETE FROM Services WHERE ServiceId = @ServiceId	
		SELECT @QStatus = 1;
		COMMIT TRANSACTION		
    END TRY

    BEGIN CATCH
    ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END










GO
/****** Object:  StoredProcedure [dbo].[ServicesGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServicesGetById]
	(@ServiceId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

   SET NOCOUNT ON;

    BEGIN TRY 
    
		 SELECT *, 
			  (Select ChapterName From Chapters Where ChapterId = S.ChapterId) as ChapterName
			 ,(Select  CategoryName from ServiceCategories where S.CategoryId=ServiceCategoryId) as CategoryName
			 ,(Select Top(1) ImageUrl from ServiceImages SI Where SI.ServiceId = S.ServiceId)  as ImageUrl
			 ,(Select sum(SD.Amount) from ServiceDonations SD Where SD.ServiceId = @ServiceId)  as TotalAmount 
			    from Services S where S.ServiceId=@ServiceId


		 SELECT @QStatus = 1;
		 
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END









GO
/****** Object:  StoredProcedure [dbo].[ServicesGetChaptersService]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServicesGetChaptersService]
		(@QStatus int output)  
         
AS
BEGIN

   SET NOCOUNT ON;

    BEGIN TRY 

		 SELECT * from Chapters   where IsActive=1
		 SELECT * from ServiceCategories   where IsActive=1
		 SELECT * from ServiceTypes   where IsActive=1

	  SELECT @QStatus = 1;

    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	

END










GO
/****** Object:  StoredProcedure [dbo].[ServicesGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServicesGetList]
    @QStatus int output
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	
	SET NOCOUNT ON;

    -- Insert statements for procedure here
    
    BEGIN TRY    
		SELECT * FROM Services ORDER BY IsDisplay DESC
			
		SELECT @QStatus = 1;	
    END TRY
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END











GO
/****** Object:  StoredProcedure [dbo].[ServicesGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ServicesGetListByVariable] 
	 (@ChapterId bigint
	 ,@CategoryId bigint
	 ,@ServiceType nvarchar(512)
	 ,@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output
	 ,@MemberId bigint)
AS
BEGIN

	
	SET NOCOUNT ON;
	
	--BEGIN TRY
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
	
    
			CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
									,ServiceId bigint
									,ChapterId bigint
									,CategoryId bigint
									,ServiceTitle nvarchar(256)
									,ServiceType nvarchar(256)
									,OrganisedBy nvarchar(256)
									,Purpose nvarchar(1024) 
									,Description nvarchar(max) 
									,ShortDescription nvarchar(1024)
									,DocumentUrl nvarchar(1024)
									,ExpiryDate datetime 
									,EstimationAmount decimal(15,2) 
									,ServiceStatus nvarchar(1024)
									,IsDisplay bit
									,Field1 nvarchar(max) 
									,Field2 nvarchar(max) 
									,UpdatedDate datetime
									,UpdatedBy nvarchar(64)
									,ChapterName nvarchar(1024)
									,CategoryName nvarchar(1024)
									,ServiceDonationsCount bigint
									,ServiceTypeName nvarchar(1024)
									,ImageUrl nvarchar(1024)
									,TotalAmount decimal(15,2)
									,DisplayOrder int )

				
			SELECT @Start = (@PageNo - 1) * @Items  
	   
			SELECT @End = @Start + @Items 
	
			SET @Query = 'INSERT INTO #temp 
				  SELECT  S.ServiceId 
						,S.ChapterId 
						,S.CategoryId 
						,S.ServiceTitle 
						,S.ServiceType 
						,S.OrganisedBy 
						,S.Purpose 
						,S.Description  
						,S.ShortDescription
						,S.DocumentUrl 
						,S.ExpiryDate  
						,S.EstimationAmount 
						,S.ServiceStatus 
						,S.IsDisplay 
						,S.Field1 
						,S.Field2 
						,S.UpdatedDate 
						,S.UpdatedBy
						,C.ChapterName
						,SC.CategoryName 
						,(Select count(*) from ServiceDonations SD where S.ServiceId=SD.ServiceId) as ServiceDonationsCount
						,(Select  ServiceType from ServiceTypes where S.ServiceType=ServiceType) as ServiceTypeName
						,(Select Top(1) ImageUrl from ServiceImages SI Where SI.ServiceId = S.ServiceId)  as ImageUrl
						,(Select sum(SD.Amount) from ServiceDonations SD Where SD.ServiceId = S.ServiceId)  as TotalAmount
						,S.DisplayOrder 
						FROM Services S
						Inner JOIN Chapters C  ON S.ChapterId = C.ChapterId
						Inner JOIN ServiceCategories SC ON S.CategoryId = SC.ServiceCategoryId
						WHERE S.ServiceId <> 0 '
		
			IF(@ChapterId<>0)
				BEGIN
					SET @Query=@Query + ' AND S.ChapterId = ' + CAST(@ChapterId as nvarchar(50))
				END

			IF(@CategoryId<>0)
				BEGIN
					SET @Query=@Query + ' AND S.CategoryId = ' + CAST(@CategoryId as nvarchar(50))
				END

			IF(@ServiceType <> '')
				BEGIN
					SET @Query = @Query + ' AND  S.ServiceType LIKE ''%' + @ServiceType + '%'''
				END
		
			IF(@Search <> '')
				BEGIN
					SET @Query = @Query + ' AND  C.ChapterName LIKE ''%' + @Search + '%'' OR SC.CategoryName  LIKE ''%' + @Search + '%'' OR S.ServiceTitle LIKE ''%' + @Search + '%'' OR S.ServiceType  LIKE ''%' + @Search + '%'''
				END

			IF(@Sort <> '')
				BEGIN
					SET @Query = @Query + ' ORDER BY ' + @Sort
				END
	
			EXEC sp_ExecuteSQL @Query;
			print @Query;
			SELECT @Total = COUNT(Rid) from #temp 
				
			SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
			DROP TABLE #temp

	--END TRY
    
 --   BEGIN CATCH  
 --      SELECT @Total = -1; 		   
 --   END CATCH   
END








GO
/****** Object:  StoredProcedure [dbo].[ServicesInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ServicesInsert]
    (@ServiceId bigint
	,@ChapterId bigint
	,@CategoryId bigint
	,@ServiceTitle nvarchar(256)
	,@ServiceType nvarchar(256)
	,@OrganisedBy nvarchar(256)
	,@Purpose nvarchar(1024) 
	,@Description nvarchar(max) 
	,@ShortDescription nvarchar(1024)
	,@DocumentUrl nvarchar(1024) output
	,@ExpiryDate datetime 
	,@EstimationAmount decimal(15,2) 
	,@ServiceStatus nvarchar(1024)
	,@IsDisplay bit
	,@Field1 nvarchar(max) 
	,@Field2 nvarchar(max) 
	,@UpdatedDate datetime
	,@UpdatedBy nvarchar(64)
	,@DisplayOrder int
	,@QStatus int output)  
        
AS
BEGIN

	SET NOCOUNT ON;

    BEGIN TRY
    BEGIN TRANSACTION

			IF((SELECT COUNT(*) FROM Services WHERE ServiceId = @ServiceId) = 0)
				BEGIN
					INSERT INTO Services VALUES
						(@ChapterId 
						,@CategoryId 
						,@ServiceTitle 
						,@ServiceType 
						,@OrganisedBy
						,@Purpose 
						,@Description
						,@ShortDescription 
						,null 
						,@ExpiryDate  
						,@EstimationAmount 
						,@ServiceStatus 
						,@IsDisplay 
						,@Field1 
						,@Field2  
						,@UpdatedDate 
						,@UpdatedBy
						,@DisplayOrder )		
						SET @ServiceId=SCOPE_IDENTITY(); 
					SELECT @QStatus = 1;	
				 END
			ELSE
				BEGIN
					UPDATE Services
					   SET ChapterId=@ChapterId, 
						   CategoryId=@CategoryId ,
						   ServiceTitle = @ServiceTitle,
						   ServiceType =@ServiceType,
						   OrganisedBy=@OrganisedBy ,
						   Purpose = @Purpose,
						   Description=@Description ,
						   ShortDescription=@ShortDescription,
						   ExpiryDate=@ExpiryDate ,  
						   EstimationAmount=@EstimationAmount,
						   ServiceStatus=@ServiceStatus ,
						   IsDisplay=@IsDisplay,
						   Field1=@Field1,
						   Field2=@Field2,
						   UpdatedDate=@UpdatedDate,
						   UpdatedBy=@UpdatedBy
						   ,DisplayOrder=@DisplayOrder  
					 WHERE ServiceId = @ServiceId
		 		 
					 SELECT @QStatus = 2;	
				END

			IF(@DocumentUrl <> 'N/A')
				BEGIN
					UPDATE Services
						SET  DocumentUrl= CAST(@ServiceId  AS nvarchar(12)) + '-' + dbo.RemoveSpecialChar(@ServiceTitle, '^a-z0-9') + @DocumentUrl
						WHERE ServiceId = @ServiceId
			  
						SELECT @DocumentUrl = CAST(@ServiceId  AS nvarchar(12)) + '-' + dbo.RemoveSpecialChar(@ServiceTitle, '^a-z0-9') + @DocumentUrl	
				END	
			ELSE
				BEGIN
					SELECT @DocumentUrl=''
				END

	


    COMMIT TRANSACTION
    END TRY
    
    BEGIN CATCH    
    ROLLBACK TRANSACTION
		SELECT @QStatus = -1;    
    END CATCH   
	 
END












GO
/****** Object:  StoredProcedure [dbo].[ServicesUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ServicesUpdateStatus]
    (@ServiceId bigint
    ,@QStatus int output)  
        
AS
BEGIN

	SET NOCOUNT ON;

    BEGIN TRY    
    BEGIN TRANSACTION
    
		IF((SELECT IsDisplay FROM Services WHERE ServiceId = @ServiceId) = 1)
			BEGIN
				UPDATE Services SET IsDisplay = 0 WHERE ServiceId = @ServiceId
			END
		ELSE
			BEGIN
				UPDATE Services SET IsDisplay = 1 WHERE ServiceId = @ServiceId
			END		
		
		SELECT @QStatus = 1;
		
	COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END











GO
/****** Object:  StoredProcedure [dbo].[ServiceTypesDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServiceTypesDelete]
    (@ServiceTypeId bigint
    ,@QStatus int output )  
        
AS
BEGIN

	
	SET NOCOUNT ON;

    BEGIN TRY    
    BEGIN TRANSACTION

		DELETE FROM ServiceTypes WHERE ServiceTypeId = @ServiceTypeId		
		SELECT @QStatus = 1;
				
    COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
    ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END










GO
/****** Object:  StoredProcedure [dbo].[ServiceTypesGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ServiceTypesGetById]
	(@ServiceTypeId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN

   SET NOCOUNT ON;

    BEGIN TRY 
    
		 SELECT * from ServiceTypes WHERE ServiceTypeId = @ServiceTypeId	
		 SELECT @QStatus = 1;
		 
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END










GO
/****** Object:  StoredProcedure [dbo].[ServiceTypesGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServiceTypesGetList]
	(@QStatus int OUTPUT)    
        
AS
BEGIN

   SET NOCOUNT ON;

    BEGIN TRY 
    
		 SELECT * FROM ServiceTypes
		 SELECT @QStatus = 1;
		 
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END










GO
/****** Object:  StoredProcedure [dbo].[ServiceTypesGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ServiceTypesGetListByVariable]   
	 (@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)
AS
BEGIN

	SET NOCOUNT ON;
	
	BEGIN TRY
	
		DECLARE @Start int, @End INT ;
		DECLARE @Query nvarchar(max);
	
		CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
							,ServiceTypeId bigint
							,ServiceType nvarchar(512)
							,Descriptione nvarchar(max)
							,IsActive bit
							,OrderNo bigint	
							,UpdateDate datetime
							,UpdatedBy nvarchar(128))
				
		SELECT @Start = (@PageNo - 1) * @Items  
	   
		SELECT @End = @Start + @Items 
	
		SET @Query = 'INSERT INTO #temp SELECT
						 S.ServiceTypeId
						,S.ServiceType
						,S.Descriptione
						,S.IsActive
						,S.OrderNo
						,S.UpdateDate
						,S.UpdatedBy
						FROM ServiceTypes S 		
						WHERE s.ServiceTypeId <> 0 '
		
			IF(@Search <> '')
				BEGIN
					SET @Query = @Query + ' AND  S.ServiceType LIKE ''%' + @Search + '%'''
				END
				
			IF(@Sort <> '')
				BEGIN
					SET @Query = @Query + ' ORDER BY ' + @Sort
				END
	
			EXEC sp_ExecuteSQL @Query;
		
			SELECT @Total = COUNT(Rid) from #temp 
				
			SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
			DROP TABLE #temp

	END TRY
    
    BEGIN CATCH  
       SELECT @Total = -1; 		   
    END CATCH   
END











GO
/****** Object:  StoredProcedure [dbo].[ServiceTypesInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ServiceTypesInsert]
    (@ServiceTypeId bigint
	,@ServiceType nvarchar(512)
	,@Descriptione nvarchar(max)
	,@IsActive bit
	,@OrderNo bigint	
	,@UpdateDate datetime
	,@UpdatedBy nvarchar(128)
	,@QStatus int output)  
        
AS
BEGIN

	SET NOCOUNT ON;

    BEGIN TRY
    BEGIN TRANSACTION

		IF((SELECT COUNT(*) FROM ServiceTypes WHERE ServiceTypeId = @ServiceTypeId) = 0)
		BEGIN
			INSERT INTO ServiceTypes VALUES
				(@ServiceType
				,@Descriptione
				,@IsActive
				,@OrderNo
				,@UpdateDate
				,@UpdatedBy)		
			
			SELECT @QStatus = 1;	
		END
		ELSE
		BEGIN
			UPDATE ServiceTypes
			   SET
				  ServiceType=@ServiceType 
				,Descriptione = @Descriptione
				,UpdatedBy=@UpdatedBy
				,UpdateDate=@UpdateDate
			 WHERE ServiceTypeId = @ServiceTypeId
		 		 
			 SELECT @QStatus = 1;	
		END

    COMMIT TRANSACTION
    END TRY
    
    BEGIN CATCH    
    ROLLBACK TRANSACTION
		SELECT @QStatus = -1;    
    END CATCH    
END













GO
/****** Object:  StoredProcedure [dbo].[ServiceTypesUpdateOrderNo]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServiceTypesUpdateOrderNo]
    (@ServiceTypeId bigint
    ,@OrderNo int
    ,@QStatus int output)  
        
AS
BEGIN

	SET NOCOUNT ON;
    BEGIN TRY    
    BEGIN TRANSACTION
    
		IF((SELECT COUNT(*) FROM ServiceTypes WHERE ServiceTypeId = @ServiceTypeId) = 1)
			BEGIN
				UPDATE ServiceTypes SET OrderNo = @OrderNo WHERE ServiceTypeId = @ServiceTypeId
				SELECT @QStatus = 1;
			END
		ELSE
			BEGIN
				SELECT @QStatus = 3;
			END	
	COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END



















GO
/****** Object:  StoredProcedure [dbo].[ServiceTypesUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ServiceTypesUpdateStatus]
    (@ServiceTypeId bigint
    ,@QStatus int output)  
        
AS
BEGIN

	SET NOCOUNT ON;

    BEGIN TRY    
    BEGIN TRANSACTION
    
		IF((SELECT IsActive FROM ServiceTypes WHERE ServiceTypeId = @ServiceTypeId) = 1)
			BEGIN
				UPDATE ServiceTypes SET IsActive = 0 WHERE ServiceTypeId = @ServiceTypeId
			END
		ELSE
			BEGIN
				UPDATE ServiceTypes SET IsActive = 1 WHERE ServiceTypeId = @ServiceTypeId
			END		
		
		SELECT @QStatus = 1;
		
	COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1; 
    END CATCH
    	
END











GO
/****** Object:  StoredProcedure [dbo].[ServiceUpdateOrderNo]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ServiceUpdateOrderNo]
    (@ServiceId bigint
    ,@DisplayOrder int
    ,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		BEGIN TRANSACTION
    
			IF((SELECT COUNT(*) FROM Services WHERE ServiceId = @ServiceId) = 1)
				BEGIN
					UPDATE Services SET DisplayOrder = @DisplayOrder WHERE ServiceId = @ServiceId
					SELECT @QStatus = 1;
				END
			ELSE
				BEGIN
					SELECT @QStatus = 3;
				END	
		COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END













GO
/****** Object:  StoredProcedure [dbo].[SP_AssignMenu_GetRoles]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_AssignMenu_GetRoles]
    (@QStatus int output)  
        
AS
BEGIN

	SET NOCOUNT ON;

    BEGIN TRY    
    BEGIN TRANSACTION
    
		 Select Distinct RoleId, RoleName from Roles order by RoleName asc
		
	  SELECT @QStatus = 1;
		
	COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION     
		 SELECT @QStatus = -1;
    END CATCH
    	
END





GO
/****** Object:  StoredProcedure [dbo].[SP_AssignMenu_InsertRoleMenu]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[SP_AssignMenu_InsertRoleMenu]      
(@CreatedDate datetime
,@CreatedBy varchar(50)
,@UserId int
,@AssignedMenus varchar(max)
,@MenuId int
,@Roleid int 
,@QStatus int output
)      

WITH       

EXECUTE AS CALLER      

AS      
BEGIN 

SET NOCOUNT ON;

		BEGIN TRY
		BEGIN TRANSACTION
  
				 IF(@AssignedMenus != '' AND @AssignedMenus != 'Empty,'+CAST(@MenuId as nvarchar(64)))
					BEGIN
					   Delete from Role_Menu  where EmployeeCompanyId=@UserId and (MenuId in (Select M.MenuItemId From AdminMenuItems M Where M.PageParentId = @MenuId) OR MenuId = @MenuId)    

							Insert into Role_Menu 
										(MenuId
										,CreatedDate
										,createdBy
										,EmployeeCompanyId
										,RoleId)      

							Select distinct Value
										,@CreatedDate
										,@CreatedBy
										,@UserId
										,@Roleid 
										from MultipleSelectionForSSRSReport(@AssignedMenus,',' )
										
					SELECT @QStatus = 1;   
						
					END
				ELSE
					BEGIN
						Delete from Role_Menu  where EmployeeCompanyId=@UserId and (MenuId in (Select M.MenuItemId From AdminMenuItems M Where M.PageParentId = @MenuId) OR MenuId = @MenuId)    
					END


		   COMMIT TRANSACTION 
		   END TRY

	   BEGIN CATCH
	   SELECT @QStatus = -1;
		  ROLLBACK TRANSACTION
	   END CATCH
   
END
















GO
/****** Object:  StoredProcedure [dbo].[SP_AssihnMenu_GetSubMenu]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[SP_AssihnMenu_GetSubMenu]
    (@MenuItemId int,
	 @UserId int,
	 @QStatus int output,
	 @Roleid int)  
        
AS
BEGIN

	SET NOCOUNT ON;

    BEGIN TRY    
    BEGIN TRANSACTION

		/****************************** Main Menu *****************************/

		select distinct DisplayName, MenuItemId from AdminMenuItems where PageLevel=1
	

		/*********************************Sub Menu *******************************/

		select distinct DisplayName,MenuItemId, PageParentId from AdminMenuItems where PageLevel=2 

		select distinct(MenuId) from Role_Menu where RoleId=@Roleid 


		SELECT @QStatus = 1;
		
	COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION     
		 SELECT @QStatus = -1;
    END CATCH
    	
END





GO
/****** Object:  StoredProcedure [dbo].[SP_Users_GetUsersByRole]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE Procedure [dbo].[SP_Users_GetUsersByRole]
(@RoleId int,
 @QStatus int output)

AS  
BEGIN 

SET NOCOUNT ON;  
  
		BEGIN TRY
		BEGIN TRANSACTION  
			
			Select U.UserId, 
				U.UserName 
				from Users U
				INNER JOIN UserRoles UR on UR.UserId = U.UserId
				where UR.RoleId IN (@RoleId)

				SELECT @QStatus = 1;

		 COMMIT TRANSACTION
	     END TRY  
	     
		BEGIN CATCH
		SELECT @QStatus = -1;
				ROLLBACK TRANSACTION;
		END CATCH
     
END









GO
/****** Object:  StoredProcedure [dbo].[UpdateAppVersion]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[UpdateAppVersion]
    (@Email nvarchar(128)
	,@Version nvarchar(128)
	,@Role nvarchar(128)
	,@QStatus int output
	,@Type nvarchar(128))  
	    
        
AS
BEGIN

	SET NOCOUNT ON;

    BEGIN TRY    
	BEGIN
		IF(@Type <> 'IOS')
			BEGIN
				UPDATE AppInfo
				SET
				PageItems = @Version
			END
		ELSE
			BEGIN
				UPDATE AppInfo
				SET
				UpdatedBy = @Version
			END
		select @QStatus=1
	END 
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH 
END








GO
/****** Object:  StoredProcedure [dbo].[UpdateCulturalRegistrationsPaymentInfo]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
  
CREATE PROCEDURE [dbo].[UpdateCulturalRegistrationsPaymentInfo]  
    (@CulturalRegistrationId bigint     
	 ,@PaymentStatusId bigint  
	 ,@PaymentDate datetime  
	 ,@PaymentMethodId bigint  
	 ,@TransactionId nvarchar(64)  
	 ,@AmountPaid decimal(15,2)  
	 ,@QStatus int output)    
          
AS  
BEGIN  
  
   
 SET NOCOUNT ON;  
  
      
    BEGIN TRY  
    BEGIN TRANSACTION  
      
  IF((SELECT COUNT(*) FROM CulturalRegistrations WHERE CulturalRegistrationId = @CulturalRegistrationId) <> 0)  
   BEGIN  
    UPDATE CulturalRegistrations  
       SET  
      PaymentStatusId = @PaymentStatusId   
      ,PaymentDate  = @PaymentDate   
      ,PaymentMethodId = @PaymentMethodId   
      ,TransactionId  = @TransactionId   
      ,AmountPaid   = @AmountPaid   
        WHERE CulturalRegistrationId   =   @CulturalRegistrationId  
       
   SELECT @QStatus = 1;  
     
   END  
  

 COMMIT TRANSACTION     
    END TRY  
      
    BEGIN CATCH   
  ROLLBACK TRANSACTION       
  SELECT @QStatus = -1;      
    END CATCH     
      
END  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  



GO
/****** Object:  StoredProcedure [dbo].[UpdateRoleBasedAccess]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[UpdateRoleBasedAccess]
        (@UserId bigint 
		,@UserRoleId bigint
		,@RoleId bigint
		,@IsAdd bit
		,@IsEdit bit
		,@IsView bit
		,@IsDelete bit
		,@IsExport bit
		,@QStatus int output
		,@ParentId bigint)  	
	AS
BEGIN
 --BEGIN TRY
 --   BEGIN TRANSACTION
	
	BEGIN	

	
	DELETE FROM UserRoles WHERE UserId = @UserId AND RoleId = @ParentId;
	DELETE FROM UserRoles WHERE UserId = @UserId AND RoleId = @RoleId;
	IF((SELECT COUNT(*) FROM UserRoles WHERE RoleId = @ParentId AND UserId = @UserId) = 0)
	BEGIN

	INSERT INTO UserRoles 
						VALUES (@UserId
						,@ParentId
						,NULL
						,@IsAdd
						,@IsEdit
						,@IsView
						,@IsDelete
						,@IsExport
						)   
	END
	ELSE
	BEGIN
	UPDATE UserRoles SET
			UserId = @UserId,
			RoleId = @ParentId,
			IsAdd = @IsAdd,
			IsEdit = @IsEdit,
			IsView = @IsView,
			IsDelete = @IsDelete,
			IsExport = @IsExport
			where UserRoleId = @UserRoleId
	END

	IF((SELECT COUNT(*) FROM UserRoles WHERE UserRoleId = @UserRoleId) = 0)
	BEGIN
	INSERT INTO UserRoles 
						VALUES (@UserId
						,@RoleId
						,NULL
						,@IsAdd
						,@IsEdit
						,@IsView
						,@IsDelete
						,@IsExport
						)    
	END
	ELSE
	BEGIN
	UPDATE UserRoles SET
			UserId = @UserId,
			RoleId = @RoleId,
			IsAdd = @IsAdd,
			IsEdit = @IsEdit,
			IsView = @IsView,
			IsDelete = @IsDelete,
			IsExport = @IsExport
			where UserRoleId = @UserRoleId

	END
		
				 SELECT @QStatus = 1;	
			END	
  --  COMMIT TRANSACTION
  --  END TRY
    
  --  BEGIN CATCH  
  --  ROLLBACK TRANSACTION  
		--SELECT @QStatus = -1;    
  --  END CATCH    
    END

	







GO
/****** Object:  StoredProcedure [dbo].[UpdateUser]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UpdateUser]
    (@UserId int
	,@UserName nvarchar(64)
	,@Email nvarchar(128)
	,@Designation nvarchar(1024)
	,@MobilePhone nvarchar(64)
    ,@UpdatedTime datetime
	,@UpdatedBy nvarchar(64)
	,@ChapterIds nvarchar(max)
	,@QStatus int output)  
	    
        
AS
BEGIN
	
	SET NOCOUNT ON;

    BEGIN TRY    
    
		UPDATE Users
		SET
		 Email		 = @Email
		,Designation = @Designation
		,MobilePhone = @MobilePhone
		,UpdatedBy   = @UpdatedBy
		,UpdatedTime = @UpdatedTime WHERE UserId = @UserId


	SELECT @QStatus = 1;		
		
    END TRY
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END

IF(@ChapterIds<>'')
	Begin
		DECLARE @RowCount1 AS int
		DECLARE @CurrentRow1 AS int	
		DECLARE @table1 TABLE (RowID int not null primary key identity(1,1), col1 int )  
		INSERT into @table1 (col1) SELECT part FROM SplitString(@ChapterIds)

		DELETE ChapterUsers WHERE UserId = @UserId

		IF((Select Count(*) From @table1) <> 0)
		BEGIN
			Set @RowCount1 = (Select Count(*) From @table1)
			SET @CurrentRow1 = 1
			WHILE @CurrentRow1 < @RowCount1 + 1 
			BEGIN
				INSERT INTO ChapterUsers VALUES 
				((select col1 from @table1 where RowID = @CurrentRow1)
				,@UserId)

				SET @CurrentRow1 = @CurrentRow1 + 1
			END
		END 
		END 








GO
/****** Object:  StoredProcedure [dbo].[UserRolesGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/****** Object:  StoredProcedure dbo.UserRolesGetById    Script Date: 09/07/2013

Stored Procedure	-	UserRolesGetById
Created by			-	Ch.Susheel
Created On			-	20/12/2013
Purpose				-	Store Procedure is used to get InnerPageCategories Deatils by passing Id.
Parameters			-	QStatus	            datatype	int      output variable
******/
CREATE PROCEDURE [dbo].[UserRolesGetById]
	(
	@UserId bigint,
	@QStatus int OUTPUT)    
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	
   SET NOCOUNT ON;

    -- Insert statements for procedure here

    BEGIN TRY 
    
		 SELECT * FROM UserRoles UR INNER JOIN Roles R ON UR.RoleId=R.RoleId WHERE UserId=@UserId
		 
		 SELECT @QStatus = 1;
		 
    END TRY
    
    BEGIN CATCH
    
		 SELECT @QStatus = -1;
		 
    END CATCH	
	 
END









GO
/****** Object:  StoredProcedure [dbo].[UserRolesSubDropDownGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UserRolesSubDropDownGetList]
	(@QStatus int OUTPUT
	,@keyword nvarchar(512))    
        
AS
BEGIN
	
   SET NOCOUNT ON;

   set @keyword = null;

    BEGIN TRY 
	IF(@keyword <> '')
	BEGIN
	 SELECT  * FROM Roles WHERE RoleName<>'SuperAdmin' AND RoleName<>'DeveloperAdmin' AND IsActive = 1 AND ParentId <> 0 AND RoleName LIKE '%''' + @keyword + '''%' ORDER BY UpdatedTime DESC
	END
	ELSE
	BEGIN
		 SELECT  * FROM Roles WHERE RoleName<>'SuperAdmin' AND RoleName<>'DeveloperAdmin' AND IsActive = 1 AND ParentId <> 0 ORDER BY UpdatedTime DESC
	END
		 SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END








GO
/****** Object:  StoredProcedure [dbo].[UsersChangePassword]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UsersChangePassword]
    (@UserId nvarchar(512)
    ,@Password nvarchar(256)
    ,@QStatus int output )  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY		
		UPDATE Users SET Password = @Password, LastPasswordChangedDate = GETDATE() WHERE Email =@UserId		
		SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END










GO
/****** Object:  StoredProcedure [dbo].[UsersChangePasswordnew]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UsersChangePasswordnew]
    (@UserId int
    ,@Password nvarchar(256)
    ,@QStatus int output )  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY		
		UPDATE Users SET Password = @Password, LastPasswordChangedDate = GETDATE() WHERE UserId =@UserId		
		SELECT @QStatus = 1;
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END








GO
/****** Object:  StoredProcedure [dbo].[UsersDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UsersDelete]
    (@UserId bigint
    ,@QStatus int output )  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY 
		BEGIN TRANSACTION   
			DELETE FROM Users WHERE UserId = @UserId		
			SELECT @QStatus = 1;	
		COMMIT TRANSACTION	
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END








GO
/****** Object:  StoredProcedure [dbo].[UsersDeleteAll]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UsersDeleteAll]
(@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		BEGIN TRANSACTION
    
			DELETE FROM Users  
			SELECT @QStatus = 1;
		
		COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
    
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
		 
    END CATCH
    	
END









GO
/****** Object:  StoredProcedure [dbo].[UsersGetByEmail]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UsersGetByEmail]
	(@Email nvarchar(128)
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
	
   SET NOCOUNT ON;

   BEGIN TRY 
		   SELECT  U.UserId
				  ,U.UserName
				  ,U.Email
				  ,U.Password
				  ,U.Designation
				  ,U.MobilePhone
				  ,U.ProfileImage
				  ,U.IsApproved
				  ,U.IsLockedOut
				  ,U.IsActivated
				  ,U.DateActivated
				  ,U.RegistrationGUID
				  ,U.FailedPasswordAttemptCount
				  ,U.LastPasswordChangedDate
				  ,U.LastLoginDate
				  ,U.InsertedTime
				  ,U.InsertedBy
				  ,U.UpdatedTime
				  ,U.UpdatedBy	
				  ,(SELECT CAST((SELECT CAST(RoleId as nvarchar(80)) + ',' FROM Roles R  WHERE RoleId IN (SELECT RoleId FROM UserRoles WHERE RoleId=R.RoleId AND UserId=(SELECT UserId FROM Users WHERE Email=@Email)) FOR XML PATH('')) AS NVARCHAR(max))) as RoleIds
				  ,(SELECT CAST((SELECT CAST(RoleName as nvarchar(80)) + ',' FROM Roles R  WHERE RoleId IN (SELECT RoleId FROM UserRoles WHERE RoleId=R.RoleId AND UserId=(SELECT UserId FROM Users WHERE Email=@Email)) FOR XML PATH('')) AS NVARCHAR(max))) as RoleName
				  FROM Users U  
				  WHERE U.Email = @Email
		 SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END








GO
/****** Object:  StoredProcedure [dbo].[UsersGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UsersGetById]
	(@UserId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
	
   SET NOCOUNT ON;

    BEGIN TRY 
		 SELECT    U.UserId
				  ,U.UserName
				  ,U.Email
				  ,U.Password
				  ,U.Designation
				  ,U.MobilePhone
				  ,U.IsApproved
				  ,U.IsLockedOut
				  ,U.IsActivated
				  ,U.ProfileImage
				  ,U.DateActivated
				  ,U.RegistrationGUID
				  ,U.FailedPasswordAttemptCount
				  ,U.LastPasswordChangedDate
				  ,U.LastLoginDate
				  ,U.InsertedTime
				  ,U.InsertedBy
				  ,U.UpdatedTime
				  ,U.UpdatedBy
				  ,U.ChapterId
				  ,(SELECT CAST((SELECT CAST(ChapterId as nvarchar(80)) + ',' FROM Chapters R  WHERE ChapterId IN (SELECT ChapterId FROM ChapterUsers WHERE ChapterId=R.ChapterId AND UserId=(SELECT UserId FROM Users WHERE UserId=@UserId)) FOR XML PATH('')) AS NVARCHAR(max))) as ChapterIds
				  ,(SELECT CAST((SELECT CAST(RoleId as nvarchar(80)) + ',' FROM Roles R  WHERE RoleId IN (SELECT RoleId FROM UserRoles WHERE RoleId=R.RoleId AND UserId=(SELECT UserId FROM Users WHERE UserId=@UserId)) FOR XML PATH('')) AS NVARCHAR(max))) as RoleIds
				  ,(SELECT CAST((SELECT CAST(RoleName as nvarchar(80)) + ',' FROM Roles R  WHERE RoleId IN (SELECT RoleId FROM UserRoles WHERE RoleId=R.RoleId AND UserId=(SELECT UserId FROM Users WHERE UserId=@UserId)) FOR XML PATH('')) AS NVARCHAR(max))) as RoleName				  
				  FROM Users U  
				  WHERE U.UserId = @UserId			
				  
				  
				  
				   
				  
				  select * from ChapterUsers where 	UserId = @UserId	
		 SELECT @QStatus = 1;
		 
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END









GO
/****** Object:  StoredProcedure [dbo].[UsersGetByPassword]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UsersGetByPassword]
	(@UserId nvarchar(512)
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
	
    SET NOCOUNT ON;

    BEGIN TRY 
		 SELECT Password from Users where Email = @UserId
		 SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END








GO
/****** Object:  StoredProcedure [dbo].[UsersGetByUserName]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UsersGetByUserName]
    @UserName nvarchar(128), 				
    @QStatus int output   
        
AS
BEGIN
	SET NOCOUNT ON;

    BEGIN TRY
   --         Update Users SET LastLoginDate=GETDATE() WHERE Email = @UserName		
			--SELECT U.MemberId as UserId
			--	  ,U.FirstName+' '+U.LastName as UserName
			--	  ,U.Email
			--	  ,U.Password
			--	  ,U.Occupation as Designation
			--	  ,U.MobilePhone
			--	  ,U.IsApproved
			--	  ,U.IsLockedOut
			--	  ,U.IsActivated
			--	  ,U.DateActivated
			--	  ,U.RegistrationGUID
			--	  ,U.FailedPasswordAttemptCount
			--	  ,U.LastPasswordChangedDate
			--	  ,U.LastActivityDate as LastLoginDate
			--	  ,U.InsertedTime
			--	  ,U.FirstName as InsertedBy
			--	  ,U.UpdatedTime
			--	  ,U.FirstName as UpdatedBy
			--	  ,(SELECT CAST((SELECT CAST(RoleId as nvarchar(80)) + ',' FROM Roles R  WHERE RoleId IN (SELECT RoleId FROM UserRoles WHERE RoleId=R.RoleId AND MemberId=U.MemberId) FOR XML PATH('')) AS NVARCHAR(max))) as RoleIds
			--	  ,(SELECT CAST((SELECT CAST(RoleName as nvarchar(80)) + ',' FROM Roles R  WHERE RoleId IN (SELECT RoleId FROM UserRoles WHERE RoleId=R.RoleId AND MemberId=U.MemberId) FOR XML PATH('')) AS NVARCHAR(max))) as RoleName
			--      FROM Members U  	    
			--      WHERE U.Email = @UserName	
			
			
			
			SELECT  U.UserId
				  ,U.UserName
				  ,U.Email
				  ,U.Password
				  ,U.Designation
				  ,U.MobilePhone
				  ,U.ProfileImage
				  ,U.IsApproved
				  ,U.IsLockedOut
				  ,U.IsActivated
				  ,U.DateActivated
				  ,U.RegistrationGUID
				  ,U.FailedPasswordAttemptCount
				  ,U.LastPasswordChangedDate
				  ,U.LastLoginDate
				  ,U.InsertedTime
				  ,U.InsertedBy
				  ,U.UpdatedTime
				  ,U.UpdatedBy	
				  ,(SELECT CAST((SELECT CAST(RoleId as nvarchar(80)) + ',' FROM Roles R  WHERE RoleId IN (SELECT RoleId FROM UserRoles WHERE RoleId=R.RoleId AND UserId=U.UserId) FOR XML PATH('')) AS NVARCHAR(max))) as RoleIds
				  ,(SELECT CAST((SELECT CAST(RoleName as nvarchar(80)) + ',' FROM Roles R  WHERE RoleId IN (SELECT RoleId FROM UserRoles WHERE RoleId=R.RoleId AND UserId=U.UserId) FOR XML PATH('')) AS NVARCHAR(max))) as RoleName
			  	  ,ChapterId	  
			      FROM Users U  
			      WHERE U.Email = 'developers@arjunweb.in'
			
			
			
			
			
			
			
			
			
			
			
			
			
			
					
			SELECT @QStatus=1;
	    END TRY
	    
	    BEGIN CATCH
	          SELECT @QStatus=-1;
	    END CATCH
	 
END











GO
/****** Object:  StoredProcedure [dbo].[UsersGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UsersGetList]
	 @UserId int
	,@UserName nvarchar(64)
	,@Email nvarchar(128)
	,@Password nvarchar(256)
	,@Designation nvarchar(1024)
	,@MobilePhone nvarchar(64)
	,@IsApproved bit
	,@IsLockedOut bit
	,@IsActivated bit
	,@DateActivated datetime
	,@RegistrationGUID uniqueidentifier 
    ,@FailedPasswordAttemptCount int
    ,@LastPasswordChangedDate datetime
	,@LastLoginDate datetime
	,@InsertedTime datetime
	,@InsertedBy nvarchar(64)
	,@UpdatedTime datetime
	,@UpdatedBy nvarchar(64)
	,@RoleId bigint
	,@RoleName nvarchar(50)
    ,@Sort nvarchar(150)
    ,@PageNo int
    ,@Items int
    ,@Total int output
    ,@QStatus int output
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY
    
		CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
			,UserId int
			,UserName nvarchar(64)
			,Email nvarchar(128)
			,Password nvarchar(256)
			,Designation nvarchar(1024)
			,MobilePhone nvarchar(64)
			,IsApproved bit
			,IsLockedOut bit
			,IsActivated bit
			,DateActivated datetime
			,RegistrationGUID uniqueidentifier 
			,FailedPasswordAttemptCount int
			,LastPasswordChangedDate datetime
			,LastLoginDate datetime
			,InsertedTime datetime
			,InsertedBy nvarchar(64)
			,UpdatedTime datetime
			,UpdatedBy nvarchar(64)
			,RoleId bigint
			,RoleName nvarchar(50))
		
		
		DECLARE @Query nvarchar(max);
		DECLARE @Start int, @End INT ;
		
		SELECT @Start = (@PageNo - 1) * @Items
		SELECT @End = @Start + @Items	
	    

		SET @Query = 'INSERT INTO #temp	SELECT 
			 U.UserId 
			,U.UserName 
			,U.Email 
			,U.Password 
			,U.Designation 
			,U.MobilePhone
			,U.IsApproved 
			,U.IsLockedOut 
			,U.IsActivated 
			,U.DateActivated 
			,U.RegistrationGUID
			,U.FailedPasswordAttemptCount 
			,U.LastPasswordChangedDate
			,U.LastLoginDate
			,U.InsertedTime
			,U.InsertedBy
			,U.UpdatedTime
			,U.UpdatedBy
			,UI.RoleId
			,UI.RoleName
			,UI.IsActive 
			,UI.UpdatedTime 
			,(SELECT CAST((SELECT CAST(RoleId as nvarchar(80)) + '','' FROM Roles r  WHERE RoleId IN (SELECT RoleId FROM UserRoles WHERE RoleId=r.RoleId AND UserId=U.UserId) FOR XML PATH('''')) AS NVARCHAR(max))) as RoleId
			,(SELECT CAST((SELECT CAST(RoleName as nvarchar(80)) + '','' FROM Roles r  WHERE RoleId IN (SELECT RoleId FROM UserRoles WHERE RoleId=r.RoleId AND UserId=U.UserId) FOR XML PATH('''')) AS NVARCHAR(max))) as RoleName			
		    FROM Users U
		    INNER JOIN UserInfo UI ON UI.UserId=U.UserId'
		
		IF(@RoleName <> '')
		BEGIN
			SET @Query = @Query + ' INNER JOIN UserRoles UR ON UR.UserId=U.UserId
		    INNER JOIN Roles R ON R.RoleId=Ur.RoleId'
		END
		
		SET @Query = @Query + ' WHERE IsActivated = 1'
		
		IF(@UserName <> '')
		BEGIN
			SET @Query = @Query + ' AND UserName LIKE ''%' + @UserName + '%'''
		END
		
		IF(@Email <> '')
		BEGIN
			SET @Query = @Query + ' AND Email LIKE ''%' + @Email + '%'''
		END
		
		IF(@RoleName <> '')
		BEGIN
			SET @Query = @Query + ' AND RoleName = ''' + @RoleName + ''''
		END
		
		IF(@Sort <> '')
		BEGIN
			SET @Query = @Query + ' ORDER BY ' + @Sort
		END			
		
		EXEC sp_ExecuteSQL @Query;

		SELECT @Total = COUNT(Rid) from #temp	
		
		SELECT * FROM #temp WHERE Rid > @Start AND Rid <=@End	
		DROP TABLE #temp
	
	END TRY
	
	BEGIN CATCH
		SELECT @Total = -1
	END CATCH
	
END









GO
/****** Object:  StoredProcedure [dbo].[UsersGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UsersGetListByVariable]
	 (@UserId bigint
	 ,@RoleId bigint
	 ,@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)
AS
BEGIN
	
	SET NOCOUNT ON;
	
	--BEGIN TRY
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
    
    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
				,UserName nvarchar(64)
				,UserId bigint
				,Email nvarchar(128)
				,Password nvarchar(128)
				,RoleName nvarchar(1024)
				,Designation nvarchar(1024)
				,ProfileImage nvarchar(1024)
				,MobilePhone nvarchar(64)
				,IsApproved bit
				,IsLockedOut bit
				,IsActivated bit
				,DateActivated datetime
				,RegistrationGUID uniqueidentifier
				,FailedPasswordAttemptCount int
				,LastPasswordChangedDate datetime
				,LastLoginDate datetime
				,InsertedTime datetime
				,InsertedBy nvarchar(64)		
				,UpdatedTime datetime
				,UpdatedBy nvarchar(64)
				,ChapterName nvarchar(512))
				
	SELECT @Start = (@PageNo - 1) * @Items  
	   
	SELECT @End = @Start + @Items 
	
	SET @Query = 'INSERT INTO #temp 
	SELECT
				 DISTINCT U.UserName  
				,U.UserId
				,U.Email 
				,U.Password 
				,(SELECT CAST((SELECT CAST(RoleName as nvarchar(80)) + '','' FROM Roles R1  WHERE RoleId IN (SELECT RoleId FROM UserRoles UR1 WHERE UR1.RoleId=R1.RoleId AND UR1.UserId=U.UserId) FOR XML PATH('''')) AS NVARCHAR(max))) as RoleName	
				,U.Designation 
				,U.ProfileImage
				,U.MobilePhone
				,U.IsApproved 
				,U.IsLockedOut 
				,U.IsActivated 
				,U.DateActivated 
				,U.RegistrationGUID 
				,U.FailedPasswordAttemptCount 
				,U.LastPasswordChangedDate 
				,U.LastLoginDate 
				,U.InsertedTime 
				,U.InsertedBy 		
				,U.UpdatedTime 
				,U.UpdatedBy 
				,(Select C.ChapterName from Chapters C Where C.ChapterId = U.ChapterId) As ChapterName
				FROM Users U 
				LEFT JOIN UserRoles UR ON U.UserId=UR.UserId LEFT JOIN Roles R ON R.RoleId =UR.RoleId 		
				WHERE U.UserId <> 0'
		
		IF(@Search <> '')
		BEGIN
			SET @Query = @Query + ' AND (U.UserName LIKE ''%' + @Search + '%'' OR  U.Email LIKE ''%' + @Search + '%'' OR U.MobilePhone LIKE ''%' + @Search + '%'')'
		END

		IF(@RoleId<>0)
		BEGIN
			SET @Query=@Query + ' AND R.RoleId= ' + CAST(@RoleId as nvarchar(50))
		END

		IF(@Sort <> '')
		BEGIN
			SET @Query = @Query + ' ORDER BY ' + @Sort
		END
	
		EXEC sp_ExecuteSQL @Query;
		
		SELECT @Total = COUNT(Rid) from #temp 
				
		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
		DROP TABLE #temp

	--END TRY
    
 --   BEGIN CATCH  
 --      SELECT @Total = -1; 		   
 --   END CATCH   
END









GO
/****** Object:  StoredProcedure [dbo].[UsersGetPassword]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UsersGetPassword]

@UserId nvarchar(256),
@QStatus int output

AS
BEGIN

		SET NOCOUNT ON;

		BEGIN TRY
			SELECT Password FROM Users WHERE Email = @UserId
			SELECT @QStatus = 1
		END TRY
		
		BEGIN CATCH
		    SELECT @QStatus = -1
		END CATCH

END















































GO
/****** Object:  StoredProcedure [dbo].[UsersGetRoles]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UsersGetRoles]
    (@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY	
		SELECT * FROM Roles WHERE RoleName<>'SuperAdmin'
		SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH    
		SELECT @QStatus = -1;    
    END CATCH
    
    
END








GO
/****** Object:  StoredProcedure [dbo].[UsersProfileInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/****** Object:  StoredProcedure dbo.UsersProfileInsert    Script Date: 09/30/2013 

Stored Procedure	-	Users_InsertUser
Created by			-	Ch.Susheel
Created On			-	20/12/2013
Purpose				-	Store Procedure is used to insert the user profile and role creation with parameters passed.
Parameters			-	@UserId							datatype	int
						@UserName					    datatype	datetime
						@Email							datatype	nvarchar(20)
						@Password						datatype	nvarchar(20)
						@Designation					datatype	nvarchar(250)
						@MobilePhone					datatype	nvarchar(250)
						@IsApproved						datatype	nvarchar(25)
						@IsLockedOut					datatype	nvarchar(25)
						@IsActivated					datatype	nvarchar(25)
						@DateActivated					datatype	nvarchar(512)
						@RegistrationGUID				datatype	nvarchar(10)
						@FailedPasswordAttemptCount		datatype	nvarchar(60)
						@LastPasswordChangedDate		datatype	nvarchar(30)
						@LastLoginDate					datatype	datetime
						@InsertedTime					datatype	nvarchar(30)
						@InsertedBy						datatype	datetime
						@UpdatedTime					datatype	datetime
						@UpdatedBy						datatype	nvarchar(64)
						@QStatus						datatype	int output variable
				
******/

CREATE PROCEDURE [dbo].[UsersProfileInsert]
    (@UserId int
	,@ChapterId BIGINT
	,@UserName nvarchar(64)
	,@RoleName nvarchar(128)
	,@Email nvarchar(128)
	,@Designation nvarchar(1024)
	,@MobilePhone nvarchar(64)
	,@IsApproved bit
	,@IsLockedOut bit
	,@IsActivated bit
	,@DateActivated datetime
	,@RegistrationGUID uniqueidentifier 
    ,@FailedPasswordAttemptCount int
    ,@LastPasswordChangedDate datetime
	,@LastLoginDate datetime
	,@InsertedTime datetime
	,@InsertedBy nvarchar(64)
	,@UpdatedTime datetime
	,@UpdatedBy nvarchar(64)
	,@MemberId BIGINT
	 ,@ChapterIds nvarchar(max)  
	--,@RoleName nvarchar(126)
	,@QStatus int output)  
        
AS
BEGIN

	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT IsLockedOutments.
	
	SET NOCOUNT ON;

    -- Insert IsLockedOutments for procedure here
    
    --BEGIN TRY
    --BEGIN TRANSACTION

	
    
    IF((SELECT COUNT(*) FROM Users WHERE UserId = @UserId) = 0)
    BEGIN
        INSERT INTO Users VALUES
            (@ChapterId
			,@UserName
			,@Email
			,(Select Password from Members M Where M.Email = @Email)
			,NULL
			,@Designation
			,@MobilePhone
			,@IsApproved
			,@IsLockedOut
			,@IsActivated
			,@DateActivated
			,@RegistrationGUID
			,@FailedPasswordAttemptCount
			,@LastPasswordChangedDate
			,@LastLoginDate
			,@InsertedTime
			,@InsertedBy
			,@UpdatedTime
			,@UpdatedBy
			,@RoleName
			)
			  SELECT  @UserId = SCOPE_IDENTITY()  
	
						
			
		SELECT @QStatus = 1;	
	END
		
	--COMMIT TRANSACTION
    
 --   END TRY
    
 --   BEGIN CATCH   
 --   ROLLBACK TRANSACTION 
	--	SELECT @QStatus = -1;    
 --   END CATCH    
END
IF(@ChapterIds<>'')
	Begin
		DECLARE @RowCount1 AS int
		DECLARE @CurrentRow1 AS int	
		DECLARE @table1 TABLE (RowID int not null primary key identity(1,1), col1 int )  
		INSERT into @table1 (col1) SELECT part FROM SplitString(@ChapterIds)

		DELETE ChapterUsers WHERE UserId = @UserId

		IF((Select Count(*) From @table1) <> 0)
		BEGIN
			Set @RowCount1 = (Select Count(*) From @table1)
			SET @CurrentRow1 = 1
			WHILE @CurrentRow1 < @RowCount1 + 1 
			BEGIN
				INSERT INTO ChapterUsers VALUES 
				((select col1 from @table1 where RowID = @CurrentRow1)
				,@UserId)

				SET @CurrentRow1 = @CurrentRow1 + 1
			END
		END 
		END 







GO
/****** Object:  StoredProcedure [dbo].[UsersUnlock]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UsersUnlock]
    (@UserId bigint
    ,@QStatus int output )  
        
AS
BEGIN

	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		UPDATE Users SET IsLockedOut = 0 WHERE UserId =@UserId 
		SELECT @QStatus = 1;		
    END TRY
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END








GO
/****** Object:  StoredProcedure [dbo].[UsersUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UsersUpdateStatus]
    (@UserId bigint
    ,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
    BEGIN TRANSACTION
    
		IF((SELECT IsApproved FROM Users WHERE UserId = @UserId) = 1)
			BEGIN
				UPDATE Users SET IsApproved = 0 WHERE UserId = @UserId
			END
		ELSE
			BEGIN
				UPDATE Users SET IsApproved = 1 WHERE UserId = @UserId
			END		
		
		SELECT @QStatus = 1;
		
	COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END









GO
/****** Object:  StoredProcedure [dbo].[UserUpdateRegistrationGUID]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[UserUpdateRegistrationGUID]
    (@UserId bigint
    ,@IsActivated bit
    ,@DateActivated datetime
    ,@RegistrationGUID uniqueidentifier
    ,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY
		
		UPDATE Users SET IsActivated      = @IsActivated,
						 DateActivated    = @DateActivated,
						 RegistrationGUID = @RegistrationGUID,
		IsApproved = 1
		WHERE UserId = @UserId
		
		SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH    
		SELECT @QStatus = -1;    
    END CATCH
    
    
END








GO
/****** Object:  StoredProcedure [dbo].[WebsiteBannersDelete]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[WebsiteBannersDelete]
    (@WebsiteBannerId bigint
    ,@QStatus int output )  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY  
    BEGIN TRANSACTION 
	 
			DELETE FROM WebsiteBanners WHERE WebsiteBannerId = @WebsiteBannerId		
			SELECT @QStatus = 1;

	COMMIT TRANSACTION		
    END TRY

    BEGIN CATCH
		ROLLBACK TRANSACTION
		SELECT @QStatus = -1;
    END CATCH
    	
END
































GO
/****** Object:  StoredProcedure [dbo].[WebsiteBannersGetById]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[WebsiteBannersGetById]
	(@WebsiteBannerId bigint
    ,@QStatus int OUTPUT)    
        
AS
BEGIN
	
   SET NOCOUNT ON;

    BEGIN TRY 

		    SELECT  WebsiteBannerId
					,ChapterId
					,BannerTitle
					,BannerUrl
					,RedirectUrl 
					,OrderNo 
					,Target
					,IsActive
					,UpdatedBy
					,UpdatedTime
					,Target
					FROM WebsiteBanners where WebsiteBannerId=@WebsiteBannerId

		 SELECT @QStatus = 1;
    END TRY
    
    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH	
	 
END


















GO
/****** Object:  StoredProcedure [dbo].[WebsiteBannersGetList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[WebsiteBannersGetList]
    @QStatus int output
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		SELECT * FROM WebsiteBanners	
		SELECT @QStatus = 1;	
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END

























GO
/****** Object:  StoredProcedure [dbo].[WebsiteBannersGetListByChapterId]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[WebsiteBannersGetListByChapterId]
    @ChapterId bigint
	,@QStatus int output
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		SELECT * FROM WebsiteBanners where ChapterId = @ChapterId
		SELECT @QStatus = 1;	
    END TRY

    BEGIN CATCH
		 SELECT @QStatus = -1;
    END CATCH
    	
END








GO
/****** Object:  StoredProcedure [dbo].[WebsiteBannersGetListByVariable]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[WebsiteBannersGetListByVariable]
	 (@ChapterId bigint
	 ,@Search nvarchar(126)
     ,@Sort nvarchar(126)
	 ,@PageNo int
     ,@Items int
     ,@Total int output)
AS
BEGIN
	
	SET NOCOUNT ON;
	
	BEGIN TRY
	
	DECLARE @Start int, @End INT ;
	DECLARE @Query nvarchar(max);
    
    CREATE TABLE #temp(Rid INT PRIMARY KEY IDENTITY(1,1)
				,WebsiteBannerId bigint
				,ChapterId bigint
				,BannerTitle nvarchar(256)
				,BannerUrl nvarchar(128)
				,RedirectUrl nvarchar(max)
				,OrderNo int
				,Target nvarchar(30)
				,IsActive bit
				,UpdatedBy nvarchar(64)
				,UpdatedTime datetime
				,ChapterName nvarchar(512))
				
	SELECT @Start = (@PageNo - 1) * @Items  
	   
	SELECT @End = @Start + @Items 
	
	SET @Query = 'INSERT INTO #temp SELECT 
	             E.WebsiteBannerId
				,E.ChapterId
	            ,E.BannerTitle
	            ,E.BannerUrl
	            ,E.RedirectUrl
	            ,E.OrderNo
	            ,E.Target
	            ,E.IsActive
	            ,E.UpdatedBy
	            ,E.UpdatedTime
				,C.ChapterName
	             FROM WebsiteBanners E
				 INNER JOIN Chapters C ON C.ChapterId = E.ChapterId
		WHERE E.WebsiteBannerId <> 0 '
		
		IF(@ChapterId <> 0)
		BEGIN
			SET @Query=@Query + 'AND E.ChapterId = ' + CAST(@ChapterId AS nvarchar(30))
		END  

		IF(@Search <> '')
		BEGIN
			SET @Query = @Query + ' AND  E.BannerTitle LIKE ''%' + @Search + '%'''
		END

		IF(@Sort <> '')
		BEGIN
			SET @Query = @Query + ' ORDER BY ' + @Sort
		END
	
		EXEC sp_ExecuteSQL @Query;
		
		SELECT @Total = COUNT(Rid) from #temp 
				
		SELECT * FROM #temp WHERE Rid > @Start AND  Rid <= @End
	
		DROP TABLE #temp

	END TRY
    
    BEGIN CATCH  
       SELECT @Total = -1; 		   
    END CATCH   
END











GO
/****** Object:  StoredProcedure [dbo].[WebsiteBannersInsert]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[WebsiteBannersInsert]
    (@WebsiteBannerId bigint
	,@ChapterId bigint
	,@BannerTitle nvarchar(256)
	,@BannerUrl nvarchar(1024) output
	,@RedirectUrl nvarchar(max)
	,@OrderNo int
	,@Target nvarchar(30)
	,@IsActive bit
	,@UpdatedBy nvarchar(64)
	,@UpdatedTime datetime
	,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY
    BEGIN TRANSACTION
		IF((SELECT COUNT(*) FROM WebsiteBanners WHERE WebsiteBannerId = @WebsiteBannerId) = 0)
			BEGIN
				INSERT INTO WebsiteBanners VALUES
					(@ChapterId
					,@BannerTitle
					,NULL
					,@RedirectUrl
					,@OrderNo
					,@Target
					,@IsActive
					,@UpdatedBy
					,@UpdatedTime)
			
				SET @WebsiteBannerId=SCOPE_IDENTITY()		
			
				SELECT @QStatus = 1;	
			END	
		ELSE
			BEGIN
				UPDATE WebsiteBanners
				   SET ChapterId=@ChapterId,
					   BannerTitle=@BannerTitle,
					   RedirectUrl=@RedirectUrl,
					   OrderNo=@OrderNo,
					   Target=@Target ,
					   UpdatedBy=@UpdatedBy,
					   UpdatedTime=@UpdatedTime
				 WHERE WebsiteBannerId = @WebsiteBannerId
		 		 
				 SELECT @QStatus = 2;	
			END
	
		IF(@BannerUrl <> '')
			BEGIN
				UPDATE WebsiteBanners
				   SET  BannerUrl= CAST(@WebsiteBannerId  AS nvarchar(12)) + '-' + dbo.RemoveSpecialChar(@BannerTitle, '^a-z0-9') + '.' + @BannerUrl
				   WHERE WebsiteBannerId = @WebsiteBannerId	
			  
				  SELECT @BannerUrl = CAST(@WebsiteBannerId AS nvarchar(12)) + '-' + dbo.RemoveSpecialChar(@BannerTitle, '^a-z0-9') + '.' + @BannerUrl	
			END	
		ELSE
			BEGIN
			  SELECT @BannerUrl=''
			END	
    COMMIT TRANSACTION
    END TRY
    
    BEGIN CATCH    
    ROLLBACK TRANSACTION
		SELECT @QStatus = -1;    
    END CATCH    
END















GO
/****** Object:  StoredProcedure [dbo].[WebsiteBannersUpdateOrderNo]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[WebsiteBannersUpdateOrderNo]
    (@WebsiteBannerId bigint
    ,@OrderNo int
    ,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		BEGIN TRANSACTION
    
			IF((SELECT COUNT(*) FROM WebsiteBanners WHERE WebsiteBannerId = @WebsiteBannerId) = 1)
				BEGIN
					UPDATE WebsiteBanners SET OrderNo = @OrderNo WHERE WebsiteBannerId = @WebsiteBannerId
					SELECT @QStatus = 1;
				END
			ELSE
				BEGIN
					SELECT @QStatus = 3;
				END	
		COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END













GO
/****** Object:  StoredProcedure [dbo].[WebsiteBannersUpdateStatus]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[WebsiteBannersUpdateStatus]
    (@WebsiteBannerId bigint
    ,@QStatus int output)  
        
AS
BEGIN
	
	SET NOCOUNT ON;
    
    BEGIN TRY    
		BEGIN TRANSACTION
			IF((SELECT IsActive FROM WebsiteBanners WHERE WebsiteBannerId = @WebsiteBannerId) = 1)
				BEGIN
					UPDATE WebsiteBanners SET IsActive = 0 WHERE WebsiteBannerId = @WebsiteBannerId
				END
			ELSE
				BEGIN
					UPDATE WebsiteBanners SET IsActive = 1 WHERE WebsiteBannerId = @WebsiteBannerId
				END		
			SELECT @QStatus = 1;
		COMMIT TRANSACTION
    END TRY

    BEGIN CATCH
         ROLLBACK TRANSACTION
		 SELECT @QStatus = -1;
    END CATCH
    	
END





















GO
/****** Object:  UserDefinedFunction [dbo].[MultipleSelectionForSSRSReport]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[MultipleSelectionForSSRSReport]
      (
            @List nvarchar(max),
            @SplitOn nvarchar(5)
      ) 
      RETURNS @RtnValue table
      (
            Id int identity(1,1),
            Value nvarchar(100)
      )
      AS 
      BEGIN
            While (Charindex(@SplitOn,@List)>0)
            Begin
 
                  Insert Into @RtnValue (value)
                  Select
                        Value = ltrim(rtrim(Substring(@List,1,Charindex(@SplitOn,@List)-1)))
 
                  Set @List = Substring(@List,Charindex(@SplitOn,@List)+len(@SplitOn),len(@List))
            End
 
            Insert Into @RtnValue (Value)
            Select Value = ltrim(rtrim(@List))
     
            Return
      END
 
 
 
 











GO
/****** Object:  UserDefinedFunction [dbo].[RemoveSpecialChar]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[RemoveSpecialChar] 
(
    @String NVARCHAR(MAX), 
    @MatchExpression VARCHAR(255)
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
    SET @MatchExpression =  '%['+@MatchExpression+']%'

    WHILE PatIndex(@MatchExpression, @String) > 0
        SET @String = Stuff(@String, PatIndex(@MatchExpression, @String), 1, '')

    RETURN Lower(@String)

END










GO
/****** Object:  UserDefinedFunction [dbo].[SelectAdminMenuItemsIdList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO



create FUNCTION [dbo].[SelectAdminMenuItemsIdList]
(	 
	@MenuItemId int
	,@Limit int	
)
RETURNS nvarchar(max) 
AS
BEGIN
	
	declare @cnt int
	declare @Query nvarchar(max)
	
	set @Query= 'select MenuItemId from AdminMenuItems where MenuItemId = ' + CAST(@MenuItemId as nvarchar(20))	+ ' union '  
	
	while @Limit > 1
	begin
		set @cnt=1
		while @cnt < @Limit
		begin
			set @Query=@Query + 'select MenuItemId from AdminMenuItems where PageParentId IN ('
			set @cnt=@cnt+1
		End
		
		set @Query=@Query + CAST(@MenuItemId as nvarchar(20))
		
		set @cnt=1
		while @cnt < @Limit
		begin
			set @Query=@Query + ')'
			set @cnt=@cnt+1
		End
		
		SET @Limit = @Limit - 1
		
		if(@Limit > 1)
		begin
			set @Query=@Query + '  union  '
		end
	end	
	
	RETURN @Query
	
END














GO
/****** Object:  UserDefinedFunction [dbo].[SelectInnerPageCategoriesIdList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO



CREATE FUNCTION [dbo].[SelectInnerPageCategoriesIdList]
(	 
	@InnerPageCategoryId int
	,@Limit int	
)
RETURNS nvarchar(max) 
AS
BEGIN
	
	declare @cnt int
	declare @Query nvarchar(max)
	
	set @Query= 'select InnerPageCategoryId from InnerPageCategories where InnerPageCategoryId = ' + CAST(@InnerPageCategoryId as nvarchar(20))	+ ' union '  
	
	while @Limit > 1
	begin
		set @cnt=1
		while @cnt < @Limit
		begin
			set @Query=@Query + 'select InnerPageCategoryId from InnerPageCategories where PageParentId IN ('
			set @cnt=@cnt+1
		End
		
		set @Query=@Query + CAST(@InnerPageCategoryId as nvarchar(20))
		
		set @cnt=1
		while @cnt < @Limit
		begin
			set @Query=@Query + ')'
			set @cnt=@cnt+1
		End
		
		SET @Limit = @Limit - 1
		
		if(@Limit > 1)
		begin
			set @Query=@Query + '  union  '
		end
	end	
	
	RETURN @Query
	
END

















GO
/****** Object:  UserDefinedFunction [dbo].[SelectMenuItemsIdList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/****** Object:  Functions dbo.SelectMenuItemsIdList    Script Date: 15/11/2016 *****

Stored Procedure - SelectMenuItemsIdList
Created by - Y. Chandrasekhar Reddy
Created On - 15/11/2016
Purpose		-	Function is used to get CategoryId list based on ParentCategoryId supplied for fetching Product Records. 			
******/


CREATE FUNCTION [dbo].[SelectMenuItemsIdList]
(	 
	@MenuItemId int
	,@Limit int	
)
RETURNS nvarchar(max) 
AS
BEGIN
	
	declare @cnt int
	declare @Query nvarchar(max)
	
	set @Query= 'select MenuItemId from MenuItems where MenuItemId = ' + CAST(@MenuItemId as nvarchar(20))	+ ' union '  
	
	while @Limit > 1
	begin
		set @cnt=1
		while @cnt < @Limit
		begin
			set @Query=@Query + 'select MenuItemId from MenuItems where PageParentId IN ('
			set @cnt=@cnt+1
		End
		
		set @Query=@Query + CAST(@MenuItemId as nvarchar(20))
		
		set @cnt=1
		while @cnt < @Limit
		begin
			set @Query=@Query + ')'
			set @cnt=@cnt+1
		End
		
		SET @Limit = @Limit - 1
		
		if(@Limit > 1)
		begin
			set @Query=@Query + '  union  '
		end
	end	
	
	RETURN @Query
	
END














GO
/****** Object:  UserDefinedFunction [dbo].[SelectPageParentIdList]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/****** Object:  Functions dbo.SelectPageParentIdList    Script Date: 12/03/2012 18:36:21 *****

Stored Procedure - SelectPageParentIdList
Created by - Y. Chandrasekhar Reddy
Created On - 15/11/2016
Purpose		-	Function is used to get CategoryId list based on ParentCategoryId supplied for fetching Product Records.				
******/


CREATE FUNCTION [dbo].[SelectPageParentIdList]
(	 
	@MenuItemId int
	,@Limit int	
)
RETURNS nvarchar(max) 
AS
BEGIN
	
	declare @cnt int
	declare @Query nvarchar(max)
	
	set @Query= 'select MenuItemId from MenuItems where MenuItemId = ' + CAST(@MenuItemId as nvarchar(20))	+ ' union '  
	
	while @Limit > 1
	begin
		set @cnt=1
		while @cnt < @Limit
		begin
			set @Query=@Query + 'select PageParentId from MenuItems where MenuItemId IN ('
			set @cnt=@cnt+1
		End
		
		set @Query=@Query + CAST(@MenuItemId as nvarchar(20))
		
		set @cnt=1
		while @cnt < @Limit
		begin
			set @Query=@Query + ')'
			set @cnt=@cnt+1
		End
		
		SET @Limit = @Limit - 1
		
		if(@Limit > 1)
		begin
			set @Query=@Query + '  union  '
		end
	end	
	
	RETURN @Query
	
END














GO
/****** Object:  UserDefinedFunction [dbo].[SplitString]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[SplitString] 
(
    -- Add the parameters for the function here
    @myString varchar(500)
)
RETURNS 
@ReturnTable TABLE 
(
    -- Add the column definitions for the TABLE variable here
    [id] [int] IDENTITY(1,1) NOT NULL,
    [part] [varchar](50) NULL
)
AS
BEGIN
        Declare @iSpaces int
        Declare @part varchar(50)
        Declare @deliminator nvarchar(5)
        
        Set @deliminator = ','
        
        --initialize spaces
        Select @iSpaces = charindex(@deliminator,@myString,0)
        While @iSpaces > 0

        Begin
            Select @part = substring(@myString,0,charindex(@deliminator,@myString,0))

            Insert Into @ReturnTable(part)
            Select @part

    Select @myString = substring(@mystring,charindex(@deliminator,@myString,0)+ len(@deliminator),len(@myString) - charindex(' ',@myString,0))


            Select @iSpaces = charindex(@deliminator,@myString,0)
        end

        If len(@myString) > 0
            Insert Into @ReturnTable
            Select @myString

    RETURN 
END












GO
/****** Object:  UserDefinedFunction [dbo].[SplitStringWithChar]    Script Date: 3/6/2025 5:00:49 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[SplitStringWithChar] 
(
    -- Add the parameters for the function here
    @myString varchar(500),
    @deliminator nvarchar(5)
)
RETURNS 
@ReturnTable TABLE 
(
    -- Add the column definitions for the TABLE variable here
    [id] [int] IDENTITY(1,1) NOT NULL,
    [part] [varchar](50) NULL
)
AS
BEGIN
        Declare @iSpaces int
        Declare @part varchar(50)
                
        --initialize spaces
        Select @iSpaces = charindex(@deliminator,@myString,0)
        While @iSpaces > 0

        Begin
            Select @part = substring(@myString,0,charindex(@deliminator,@myString,0))

            Insert Into @ReturnTable(part)
            Select @part

    Select @myString = substring(@mystring,charindex(@deliminator,@myString,0)+ len(@deliminator),len(@myString) - charindex(' ',@myString,0))


            Select @iSpaces = charindex(@deliminator,@myString,0)
        end

        If len(@myString) > 0
            Insert Into @ReturnTable
            Select @myString

    RETURN 
END







GO
