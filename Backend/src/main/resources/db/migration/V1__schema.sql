CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(254) NOT NULL,
    username VARCHAR(32) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    phone VARCHAR(24),
    account_type VARCHAR(20) NOT NULL DEFAULT 'PLAYER'
        CHECK (account_type IN ('PLAYER', 'OWNER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_users_email ON users (lower(email));
CREATE UNIQUE INDEX uq_users_username ON users (lower(username));

CREATE TABLE sports (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(80) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE user_favorite_sports (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport_id BIGINT NOT NULL REFERENCES sports(id),
    PRIMARY KEY (user_id, sport_id)
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(140) NOT NULL UNIQUE,
    description VARCHAR(1000),
    skill_level VARCHAR(20) NOT NULL DEFAULT 'MIXED',
    routine VARCHAR(500),
    max_members SMALLINT NOT NULL DEFAULT 20,
    public_profile BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE team_sports (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    sport_id BIGINT NOT NULL REFERENCES sports(id),
    PRIMARY KEY (team_id, sport_id)
);

CREATE TABLE team_members (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (team_id, user_id)
);

CREATE INDEX idx_team_members_user ON team_members(user_id);

CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_username VARCHAR(32) NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id),
    message VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ NOT NULL,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_pending_team_invitation
    ON team_invitations(team_id, lower(invited_username))
    WHERE status = 'PENDING';

CREATE TABLE courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    description VARCHAR(3000) NOT NULL,
    observation VARCHAR(1500),
    address_line VARCHAR(180) NOT NULL,
    address_number VARCHAR(20) NOT NULL,
    address_complement VARCHAR(100),
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    postal_code VARCHAR(12) NOT NULL,
    timezone VARCHAR(60) NOT NULL DEFAULT 'America/Sao_Paulo',
    status VARCHAR(24) NOT NULL DEFAULT 'PUBLISHED',
    average_rating NUMERIC(2, 1) NOT NULL DEFAULT 0,
    review_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);

CREATE INDEX idx_courts_search ON courts(city, state, status);
CREATE INDEX idx_courts_owner ON courts(owner_id);

CREATE TABLE court_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    storage_key VARCHAR(500) NOT NULL,
    public_url VARCHAR(1000) NOT NULL,
    alt_text VARCHAR(180) NOT NULL,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    is_cover BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (court_id, storage_key)
);

CREATE UNIQUE INDEX uq_court_cover_photo
    ON court_photos(court_id)
    WHERE is_cover = TRUE;

CREATE TABLE amenities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE court_amenities (
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    amenity_id BIGINT NOT NULL REFERENCES amenities(id),
    PRIMARY KEY (court_id, amenity_id)
);

CREATE TABLE court_sports (
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    sport_id BIGINT NOT NULL REFERENCES sports(id),
    price_per_hour NUMERIC(12, 2) NOT NULL,
    min_duration_minutes SMALLINT NOT NULL DEFAULT 60,
    max_participants SMALLINT,
    PRIMARY KEY (court_id, sport_id)
);

CREATE TABLE saved_courts (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, court_id)
);

CREATE TABLE team_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    challenged_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    sport_id BIGINT NOT NULL REFERENCES sports(id),
    created_by UUID NOT NULL REFERENCES users(id),
    message VARCHAR(1000),
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_proposal_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (challenger_team_id <> challenged_team_id)
);

CREATE TABLE challenge_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES team_challenges(id) ON DELETE CASCADE,
    proposed_by_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    message VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ends_at > starts_at)
);

ALTER TABLE team_challenges
    ADD CONSTRAINT fk_challenge_accepted_proposal
    FOREIGN KEY (accepted_proposal_id) REFERENCES challenge_proposals(id);

CREATE TABLE rental_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id UUID NOT NULL REFERENCES courts(id),
    sport_id BIGINT NOT NULL REFERENCES sports(id),
    requester_id UUID NOT NULL REFERENCES users(id),
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    requested_starts_at TIMESTAMPTZ NOT NULL,
    requested_ends_at TIMESTAMPTZ NOT NULL,
    participants SMALLINT NOT NULL,
    message VARCHAR(1000),
    quoted_amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    status VARCHAR(28) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ NOT NULL,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (requested_ends_at > requested_starts_at)
);

CREATE INDEX idx_rental_requests_requester
    ON rental_requests(requester_id, status, created_at DESC);
CREATE INDEX idx_rental_requests_court
    ON rental_requests(court_id, status, requested_starts_at);

CREATE TABLE rental_request_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_request_id UUID NOT NULL REFERENCES rental_requests(id) ON DELETE CASCADE,
    proposed_by UUID NOT NULL REFERENCES users(id),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    message VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ends_at > starts_at)
);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_request_id UUID NOT NULL UNIQUE REFERENCES rental_requests(id),
    court_id UUID NOT NULL REFERENCES courts(id),
    sport_id BIGINT NOT NULL REFERENCES sports(id),
    booked_by UUID NOT NULL REFERENCES users(id),
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    confirmation_code VARCHAR(16) NOT NULL UNIQUE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    status VARCHAR(24) NOT NULL DEFAULT 'AWAITING_PAYMENT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ends_at > starts_at)
);

CREATE INDEX idx_reservations_user ON reservations(booked_by, starts_at DESC);
CREATE INDEX idx_reservations_court ON reservations(court_id, starts_at);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL UNIQUE REFERENCES reservations(id),
    payer_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_type VARCHAR(24) NOT NULL,
    court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    rental_request_id UUID REFERENCES rental_requests(id) ON DELETE SET NULL,
    challenge_id UUID REFERENCES team_challenges(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversation_participants (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_read_at TIMESTAMPTZ,
    muted BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_conversation_participant_user
    ON conversation_participants(user_id, last_read_at);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    body VARCHAR(4000) NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation
    ON messages(conversation_id, sent_at DESC);

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_courts_updated_at
    BEFORE UPDATE ON courts
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

INSERT INTO sports (slug, name) VALUES
    ('futebol', 'Futebol'),
    ('futsal', 'Futsal'),
    ('volei', 'Vôlei'),
    ('basquete', 'Basquete'),
    ('tenis', 'Tênis'),
    ('beach-tennis', 'Beach tennis'),
    ('futevolei', 'Futevôlei'),
    ('padel', 'Padel'),
    ('handebol', 'Handebol');

INSERT INTO amenities (slug, name) VALUES
    ('estacionamento', 'Estacionamento'),
    ('vestiario', 'Vestiário'),
    ('chuveiro', 'Chuveiro'),
    ('iluminacao', 'Iluminação noturna'),
    ('arquibancada', 'Arquibancada'),
    ('wifi', 'Wi-Fi'),
    ('acessibilidade', 'Acesso para cadeira de rodas'),
    ('banheiro-acessivel', 'Banheiro acessível'),
    ('bebedouro', 'Bebedouro'),
    ('coletes', 'Coletes'),
    ('bola', 'Bola disponível'),
    ('coberta', 'Quadra coberta'),
    ('churrasqueira', 'Churrasqueira');
