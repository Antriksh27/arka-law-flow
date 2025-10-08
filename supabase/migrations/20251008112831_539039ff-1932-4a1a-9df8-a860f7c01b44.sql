-- Update upsert_legalkart_case_data function to handle petitioners, respondents, and IA details
CREATE OR REPLACE FUNCTION public.upsert_legalkart_case_data(
  p_cnr_number text,
  p_firm_id uuid,
  p_case_id uuid DEFAULT NULL,
  p_case_data jsonb DEFAULT NULL,
  p_documents jsonb DEFAULT NULL,
  p_objections jsonb DEFAULT NULL,
  p_orders jsonb DEFAULT NULL,
  p_history jsonb DEFAULT NULL,
  p_petitioners jsonb DEFAULT NULL,
  p_respondents jsonb DEFAULT NULL,
  p_ia_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_legalkart_case_id uuid;
  doc_item jsonb;
  obj_item jsonb;
  order_item jsonb;
  hist_item jsonb;
  pet_item jsonb;
  resp_item jsonb;
  ia_item jsonb;
BEGIN
  -- Upsert the main case record
  INSERT INTO public.legalkart_cases (
    cnr_num,
    firm_id,
    case_id,
    filing_number,
    filing_date,
    registration_number,
    registration_date,
    cnr_number,
    case_type,
    case_status,
    stage_of_case,
    next_hearing_date,
    coram,
    bench_type,
    judicial_branch,
    state,
    district,
    petitioner_and_advocate,
    respondent_and_advocate,
    acts,
    category,
    sub_category,
    created_at,
    updated_at
  )
  VALUES (
    p_cnr_number,
    p_firm_id,
    p_case_id,
    p_case_data->>'filing_number',
    (p_case_data->>'filing_date')::date,
    p_case_data->>'registration_number',
    (p_case_data->>'registration_date')::date,
    p_case_data->>'cnr_number',
    p_case_data->>'case_type',
    p_case_data->>'case_status',
    p_case_data->>'stage_of_case',
    (p_case_data->>'next_hearing_date')::date,
    p_case_data->>'coram',
    p_case_data->>'bench_type',
    p_case_data->>'judicial_branch',
    p_case_data->>'state',
    p_case_data->>'district',
    p_case_data->>'petitioner_and_advocate',
    p_case_data->>'respondent_and_advocate',
    p_case_data->'acts',
    p_case_data->>'category',
    p_case_data->>'sub_category',
    now(),
    now()
  )
  ON CONFLICT (cnr_num, firm_id)
  DO UPDATE SET
    case_id = EXCLUDED.case_id,
    filing_number = EXCLUDED.filing_number,
    filing_date = EXCLUDED.filing_date,
    registration_number = EXCLUDED.registration_number,
    registration_date = EXCLUDED.registration_date,
    stage_of_case = EXCLUDED.stage_of_case,
    next_hearing_date = EXCLUDED.next_hearing_date,
    coram = EXCLUDED.coram,
    bench_type = EXCLUDED.bench_type,
    judicial_branch = EXCLUDED.judicial_branch,
    state = EXCLUDED.state,
    district = EXCLUDED.district,
    category = EXCLUDED.category,
    sub_category = EXCLUDED.sub_category,
    updated_at = now()
  RETURNING id INTO v_legalkart_case_id;

  -- Delete existing petitioners for this case
  IF p_petitioners IS NOT NULL THEN
    DELETE FROM public.petitioners WHERE legalkart_case_id = v_legalkart_case_id;
    
    -- Insert new petitioners
    FOR pet_item IN SELECT * FROM jsonb_array_elements(p_petitioners)
    LOOP
      INSERT INTO public.petitioners (
        legalkart_case_id,
        firm_id,
        case_id,
        name,
        advocate_name,
        created_at
      ) VALUES (
        v_legalkart_case_id,
        p_firm_id,
        p_case_id,
        pet_item->>'name',
        pet_item->>'advocate',
        now()
      );
    END LOOP;
  END IF;

  -- Delete existing respondents for this case
  IF p_respondents IS NOT NULL THEN
    DELETE FROM public.respondents WHERE legalkart_case_id = v_legalkart_case_id;
    
    -- Insert new respondents
    FOR resp_item IN SELECT * FROM jsonb_array_elements(p_respondents)
    LOOP
      INSERT INTO public.respondents (
        legalkart_case_id,
        firm_id,
        case_id,
        name,
        advocate_name,
        created_at
      ) VALUES (
        v_legalkart_case_id,
        p_firm_id,
        p_case_id,
        resp_item->>'name',
        resp_item->>'advocate',
        now()
      );
    END LOOP;
  END IF;

  -- Delete existing IA details for this case
  IF p_ia_details IS NOT NULL THEN
    DELETE FROM public.ia_details WHERE legalkart_case_id = v_legalkart_case_id;
    
    -- Insert new IA details
    FOR ia_item IN SELECT * FROM jsonb_array_elements(p_ia_details)
    LOOP
      -- Only insert if at least one field has a value
      IF ia_item->>'ia_number' IS NOT NULL OR 
         ia_item->>'party' IS NOT NULL OR 
         ia_item->>'date_of_filing' IS NOT NULL THEN
        INSERT INTO public.ia_details (
          legalkart_case_id,
          firm_id,
          case_id,
          ia_number,
          party,
          date_of_filing,
          next_date,
          ia_status,
          created_at
        ) VALUES (
          v_legalkart_case_id,
          p_firm_id,
          p_case_id,
          ia_item->>'ia_number',
          ia_item->>'party',
          (ia_item->>'date_of_filing')::date,
          (ia_item->>'next_date')::date,
          ia_item->>'ia_status',
          now()
        );
      END IF;
    END LOOP;
  END IF;

  -- Delete existing documents for this case
  DELETE FROM public.legalkart_case_documents WHERE legalkart_case_id = v_legalkart_case_id;

  -- Insert documents if provided
  IF p_documents IS NOT NULL THEN
    FOR doc_item IN SELECT * FROM jsonb_array_elements(p_documents)
    LOOP
      INSERT INTO public.legalkart_case_documents (
        legalkart_case_id,
        firm_id,
        case_id,
        document_name,
        filed_by,
        filed_date,
        document_type,
        document_url,
        created_at
      ) VALUES (
        v_legalkart_case_id,
        p_firm_id,
        p_case_id,
        doc_item->>'document_name',
        doc_item->>'filed_by',
        (doc_item->>'filed_date')::date,
        doc_item->>'document_type',
        doc_item->>'document_url',
        now()
      );
    END LOOP;
  END IF;

  -- Delete existing objections for this case
  DELETE FROM public.legalkart_case_objections WHERE legalkart_case_id = v_legalkart_case_id;

  -- Insert objections if provided
  IF p_objections IS NOT NULL THEN
    FOR obj_item IN SELECT * FROM jsonb_array_elements(p_objections)
    LOOP
      INSERT INTO public.legalkart_case_objections (
        legalkart_case_id,
        firm_id,
        case_id,
        objection_date,
        objection_by,
        objection_status,
        objection_details,
        created_at
      ) VALUES (
        v_legalkart_case_id,
        p_firm_id,
        p_case_id,
        (obj_item->>'objection_date')::date,
        obj_item->>'objection_by',
        obj_item->>'objection_status',
        obj_item->>'objection_details',
        now()
      );
    END LOOP;
  END IF;

  -- Delete existing orders for this case
  DELETE FROM public.legalkart_case_orders WHERE legalkart_case_id = v_legalkart_case_id;

  -- Insert orders if provided
  IF p_orders IS NOT NULL THEN
    FOR order_item IN SELECT * FROM jsonb_array_elements(p_orders)
    LOOP
      INSERT INTO public.legalkart_case_orders (
        legalkart_case_id,
        firm_id,
        case_id,
        order_date,
        judge_name,
        order_summary,
        order_link,
        created_at
      ) VALUES (
        v_legalkart_case_id,
        p_firm_id,
        p_case_id,
        (order_item->>'order_date')::date,
        order_item->>'judge_name',
        order_item->>'order_summary',
        order_item->>'order_link',
        now()
      );
    END LOOP;
  END IF;

  -- Delete existing hearing history for this case
  DELETE FROM public.legalkart_case_history WHERE legalkart_case_id = v_legalkart_case_id;

  -- Insert hearing history if provided
  IF p_history IS NOT NULL THEN
    FOR hist_item IN SELECT * FROM jsonb_array_elements(p_history)
    LOOP
      INSERT INTO public.legalkart_case_history (
        legalkart_case_id,
        firm_id,
        case_id,
        hearing_date,
        judge_name,
        purpose,
        business_on_date,
        created_at
      ) VALUES (
        v_legalkart_case_id,
        p_firm_id,
        p_case_id,
        (hist_item->>'hearing_date')::date,
        hist_item->>'judge_name',
        hist_item->>'purpose',
        hist_item->>'business_on_date',
        now()
      );
    END LOOP;
  END IF;

  RETURN v_legalkart_case_id;
END;
$$;