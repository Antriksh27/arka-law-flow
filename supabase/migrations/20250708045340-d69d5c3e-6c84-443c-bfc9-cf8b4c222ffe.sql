-- Update team_members table to include receptionist role if not already present
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_role_enum') THEN
        CREATE TYPE team_role_enum AS ENUM ('admin', 'lawyer', 'paralegal', 'junior', 'office_staff', 'receptionist');
    ELSE
        -- Add receptionist to existing enum if not present
        BEGIN
            ALTER TYPE team_role_enum ADD VALUE IF NOT EXISTS 'receptionist';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Update RLS policies for contacts to allow receptionist access
DROP POLICY IF EXISTS "Staff can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Staff can update contacts" ON contacts;

CREATE POLICY "Staff and receptionist can insert contacts" 
ON contacts FOR INSERT 
WITH CHECK (
    created_by = auth.uid() AND 
    EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm.user_id = auth.uid() 
        AND tm.role = ANY(ARRAY['admin'::team_role_enum, 'lawyer'::team_role_enum, 'receptionist'::team_role_enum, 'office_staff'::team_role_enum])
    )
);

CREATE POLICY "Staff and receptionist can update contacts" 
ON contacts FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm.user_id = auth.uid() 
        AND tm.role = ANY(ARRAY['admin'::team_role_enum, 'lawyer'::team_role_enum, 'receptionist'::team_role_enum, 'office_staff'::team_role_enum])
    )
);

-- Update RLS policies for appointments to allow receptionist access
DROP POLICY IF EXISTS "Admins and lawyers can create appointments" ON appointments;
DROP POLICY IF EXISTS "Staff can create appointments" ON appointments;
DROP POLICY IF EXISTS "Staff can update appointments" ON appointments;

CREATE POLICY "Staff and receptionist can create appointments" 
ON appointments FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm.user_id = auth.uid() 
        AND tm.role = ANY(ARRAY['admin'::team_role_enum, 'lawyer'::team_role_enum, 'receptionist'::team_role_enum, 'paralegal'::team_role_enum])
    )
);

CREATE POLICY "Staff and receptionist can update appointments" 
ON appointments FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm.user_id = auth.uid() 
        AND tm.role = ANY(ARRAY['admin'::team_role_enum, 'lawyer'::team_role_enum, 'receptionist'::team_role_enum, 'paralegal'::team_role_enum])
    )
);

CREATE POLICY "Staff and receptionist can view all appointments" 
ON appointments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm.user_id = auth.uid() 
        AND tm.role = ANY(ARRAY['admin'::team_role_enum, 'lawyer'::team_role_enum, 'receptionist'::team_role_enum, 'paralegal'::team_role_enum, 'junior'::team_role_enum, 'office_staff'::team_role_enum])
    )
);