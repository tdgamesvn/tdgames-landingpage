-- HR pipeline có stage "phone_screening" (HRDashboard, remind route) nhưng enum
-- application_status trên production thiếu giá trị này → update status bị DB từ chối.
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'phone_screening' AFTER 'reviewing';
