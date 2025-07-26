-- Phase 2: Enable RLS on remaining unprotected tables and fix security issues

-- Enable RLS on remaining tables that need it
DO $$ 
BEGIN
    -- Check if tables exist before enabling RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items' AND table_schema = 'public') THEN
        ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public') THEN
        ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes' AND table_schema = 'public') THEN
        ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN
        ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'public_appointments' AND table_schema = 'public') THEN
        ALTER TABLE public.public_appointments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for invoice_items (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items' AND table_schema = 'public') THEN
        -- Check if policies don't already exist before creating
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_items' AND policyname = 'Firm members can view invoice items') THEN
            EXECUTE 'CREATE POLICY "Firm members can view invoice items" 
            ON public.invoice_items 
            FOR SELECT 
            USING (
              EXISTS (
                SELECT 1 FROM public.invoices i
                JOIN public.team_members tm ON tm.firm_id = i.firm_id
                WHERE i.id = invoice_items.invoice_id 
                AND tm.user_id = auth.uid()
              )
            )';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_items' AND policyname = 'Admins can manage invoice items') THEN
            EXECUTE 'CREATE POLICY "Admins can manage invoice items" 
            ON public.invoice_items 
            FOR ALL 
            USING (
              EXISTS (
                SELECT 1 FROM public.team_members tm 
                WHERE tm.user_id = auth.uid() 
                AND tm.role = ''admin''
              )
            )';
        END IF;
    END IF;
END $$;

-- Create RLS policies for invoices (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Firm members can view invoices') THEN
            EXECUTE 'CREATE POLICY "Firm members can view invoices" 
            ON public.invoices 
            FOR SELECT 
            USING (
              firm_id IN (
                SELECT tm.firm_id FROM public.team_members tm 
                WHERE tm.user_id = auth.uid()
              )
            )';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Admins can manage invoices') THEN
            EXECUTE 'CREATE POLICY "Admins can manage invoices" 
            ON public.invoices 
            FOR ALL 
            USING (
              EXISTS (
                SELECT 1 FROM public.team_members tm 
                WHERE tm.user_id = auth.uid() 
                AND tm.role = ''admin''
                AND tm.firm_id = invoices.firm_id
              )
            )';
        END IF;
    END IF;
END $$;

-- Create RLS policies for notes (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can view their own notes') THEN
            EXECUTE 'CREATE POLICY "Users can view their own notes" 
            ON public.notes 
            FOR SELECT 
            USING (created_by = auth.uid())';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can manage their own notes') THEN
            EXECUTE 'CREATE POLICY "Users can manage their own notes" 
            ON public.notes 
            FOR ALL 
            USING (created_by = auth.uid())';
        END IF;
    END IF;
END $$;

-- Create RLS policies for payments (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Firm members can view payments') THEN
            EXECUTE 'CREATE POLICY "Firm members can view payments" 
            ON public.payments 
            FOR SELECT 
            USING (
              EXISTS (
                SELECT 1 FROM public.invoices i
                JOIN public.team_members tm ON tm.firm_id = i.firm_id
                WHERE i.id = payments.invoice_id 
                AND tm.user_id = auth.uid()
              )
            )';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admins can manage payments') THEN
            EXECUTE 'CREATE POLICY "Admins can manage payments" 
            ON public.payments 
            FOR ALL 
            USING (
              EXISTS (
                SELECT 1 FROM public.team_members tm 
                WHERE tm.user_id = auth.uid() 
                AND tm.role = ''admin''
              )
            )';
        END IF;
    END IF;
END $$;

-- Create RLS policies for public_appointments (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'public_appointments' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'public_appointments' AND policyname = 'Public appointments are viewable by all') THEN
            EXECUTE 'CREATE POLICY "Public appointments are viewable by all" 
            ON public.public_appointments 
            FOR SELECT 
            USING (true)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'public_appointments' AND policyname = 'Anyone can create public appointments') THEN
            EXECUTE 'CREATE POLICY "Anyone can create public appointments" 
            ON public.public_appointments 
            FOR INSERT 
            WITH CHECK (true)';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'public_appointments' AND policyname = 'Lawyers can update public appointments') THEN
            EXECUTE 'CREATE POLICY "Lawyers can update public appointments" 
            ON public.public_appointments 
            FOR UPDATE 
            USING (
              EXISTS (
                SELECT 1 FROM public.team_members tm 
                WHERE tm.user_id = auth.uid() 
                AND tm.role IN (''admin'', ''lawyer'')
              )
            )';
        END IF;
    END IF;
END $$;