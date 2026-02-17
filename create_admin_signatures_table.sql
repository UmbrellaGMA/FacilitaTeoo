-- Create admin_signatures table to store signature images for admin/company
CREATE TABLE IF NOT EXISTS admin_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    signature_data TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_signatures_user_id ON admin_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_signatures_default ON admin_signatures(user_id, is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE admin_signatures ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own signatures
CREATE POLICY "Users can view own signatures"
    ON admin_signatures FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own signatures
CREATE POLICY "Users can insert own signatures"
    ON admin_signatures FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own signatures
CREATE POLICY "Users can update own signatures"
    ON admin_signatures FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own signatures
CREATE POLICY "Users can delete own signatures"
    ON admin_signatures FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_signatures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_signatures_modtime
    BEFORE UPDATE ON admin_signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_signatures_updated_at();

COMMENT ON TABLE admin_signatures IS 'Stores signature images for admin/company use in contracts';
