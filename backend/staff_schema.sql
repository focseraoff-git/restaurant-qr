-- Staff Master Table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'on-leave', 'exited'
    salary_type TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'daily', 'hourly'
    base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
    photo_url TEXT,
    docs_url TEXT,
    exit_date DATE,
    exit_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS staff_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL, -- 'present', 'absent', 'half-day', 'leave', 'late'
    in_time TIME,
    out_time TIME,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(staff_id, date)
);

-- Advance Payments (Loans) Table
CREATE TABLE IF NOT EXISTS staff_advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL, -- 'Cash', 'UPI', 'Bank'
    notes TEXT,
    is_recovery BOOLEAN DEFAULT FALSE, -- FALSE for advance, TRUE for manual repayment
    auto_deduct BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Payroll Table
CREATE TABLE IF NOT EXISTS staff_payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    month CHAR(7) NOT NULL, -- 'YYYY-MM'
    attendance_summary JSONB, -- { present: 20, absent: 2, half_day: 1, etc. }
    base_salary_snapshot DECIMAL(10, 2) NOT NULL,
    bonuses DECIMAL(10, 2) DEFAULT 0,
    deductions DECIMAL(10, 2) DEFAULT 0,
    advance_deductions DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'paid', 'partially-paid', 'pending'
    payslip_url TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(staff_id, month)
);
