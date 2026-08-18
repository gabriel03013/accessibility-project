-- =============================================================================
-- V5: Update seed user passwords to valid BCrypt hash for 'teste123456'
-- =============================================================================
UPDATE users
SET password_hash = '$2a$12$6uOKtpKc/sURukbMJ5HZt.Vp5Di8zpvpOE7XMfRqN5BrZb0Nj3YOq'
WHERE password_hash = '$2a$12$z2P.d8pGvQyPz55yR5dDpeo98o7qK1V2W3X4Y5Z6a7b8c9d0e1f2g';
