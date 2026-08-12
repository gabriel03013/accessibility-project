-- =============================================================================
-- V2 Seed Data: Complete initial dataset for all application tables
-- =============================================================================

-- 1. USERS (2 Owners, 3 Players)
INSERT INTO users (id, email, username, password_hash, display_name, phone, account_type)
VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'carlos.dono@partiuquadra.com',
    'carlos_dono',
    '$2a$12$z2P.d8pGvQyPz55yR5dDpeo98o7qK1V2W3X4Y5Z6a7b8c9d0e1f2g',
    'Carlos Silva',
    '(11) 98888-7777',
    'OWNER'
),
(
    'a0000000-0000-0000-0000-000000000002',
    'renata.proprietaria@partiuquadra.com',
    'renata_prop',
    '$2a$12$z2P.d8pGvQyPz55yR5dDpeo98o7qK1V2W3X4Y5Z6a7b8c9d0e1f2g',
    'Renata Oliveira',
    '(11) 97777-6666',
    'OWNER'
),
(
    'a0000000-0000-0000-0000-000000000003',
    'gabriel.jogador@partiuquadra.com',
    'gabriel_jogador',
    '$2a$12$z2P.d8pGvQyPz55yR5dDpeo98o7qK1V2W3X4Y5Z6a7b8c9d0e1f2g',
    'Gabriel Silva',
    '(11) 99999-1111',
    'PLAYER'
),
(
    'a0000000-0000-0000-0000-000000000004',
    'marina.costa@partiuquadra.com',
    'marina_costa',
    '$2a$12$z2P.d8pGvQyPz55yR5dDpeo98o7qK1V2W3X4Y5Z6a7b8c9d0e1f2g',
    'Marina Costa',
    '(11) 99999-2222',
    'PLAYER'
),
(
    'a0000000-0000-0000-0000-000000000005',
    'rafael.lima@partiuquadra.com',
    'rafael_lima',
    '$2a$12$z2P.d8pGvQyPz55yR5dDpeo98o7qK1V2W3X4Y5Z6a7b8c9d0e1f2g',
    'Rafael Lima',
    '(11) 99999-3333',
    'PLAYER'
)
ON CONFLICT DO NOTHING;

-- 2. USER FAVORITE SPORTS
INSERT INTO user_favorite_sports (user_id, sport_id)
VALUES
('a0000000-0000-0000-0000-000000000003', 2), -- Futsal
('a0000000-0000-0000-0000-000000000003', 3), -- Volei
('a0000000-0000-0000-0000-000000000004', 3), -- Volei
('a0000000-0000-0000-0000-000000000004', 4)  -- Basquete
ON CONFLICT DO NOTHING;

-- 3. TEAMS
INSERT INTO teams (id, created_by, name, slug, description, skill_level, routine, max_members, public_profile, status)
VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'Vôlei Vila Mariana',
    'volei-vila-mariana',
    'Time amador de vôlei focado em jogos semanais nas noites de quinta-feira.',
    'INTERMEDIATE',
    'Quintas-feiras às 19:30',
    12,
    TRUE,
    'ACTIVE'
),
(
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000005',
    'Futsal Pinheiros FC',
    'futsal-pinheiros-fc',
    'Equipe de futsal para amistosos e torneios regionais.',
    'ADVANCED',
    'Sábados pela manhã',
    16,
    TRUE,
    'ACTIVE'
)
ON CONFLICT (slug) DO NOTHING;

-- 4. TEAM SPORTS
INSERT INTO team_sports (team_id, sport_id)
VALUES
('b0000000-0000-0000-0000-000000000001', 3), -- Volei
('b0000000-0000-0000-0000-000000000002', 2)  -- Futsal
ON CONFLICT DO NOTHING;

-- 5. TEAM MEMBERS
INSERT INTO team_members (team_id, user_id, member_role, joined_at)
VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'CAPTAIN', now()),
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'MEMBER', now()),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'CAPTAIN', now())
ON CONFLICT DO NOTHING;

-- 6. TEAM INVITATIONS
INSERT INTO team_invitations (id, team_id, invited_user_id, invited_username, invited_by, message, status, expires_at)
VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000005',
    'rafael_lima',
    'a0000000-0000-0000-0000-000000000003',
    'Venha jogar vôlei com a gente esta semana!',
    'PENDING',
    now() + INTERVAL '14 days'
)
ON CONFLICT DO NOTHING;

-- 7. COURTS
INSERT INTO courts (id, owner_id, name, slug, description, observation, address_line, address_number, address_complement, neighborhood, city, state, postal_code, status, average_rating, review_count, published_at)
VALUES 
(
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Arena Vila Mariana',
    'arena-vila-mariana',
    'Quadra poliesportiva coberta com iluminação de LED, vestiário completo e arquibancada.',
    'Proibido uso de chuteira de trava alta.',
    'Rua Vergueiro',
    '1200',
    'Bloco B',
    'Vila Mariana',
    'São Paulo',
    'SP',
    '04101-000',
    'PUBLISHED',
    4.9,
    128,
    now()
),
(
    'd0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Ginásio Aurora',
    'ginasio-aurora',
    'Ginásio coberto preparado para vôlei e basquete com piso flutuante de madeira.',
    'Entrada sem degraus e estacionamento acessível no local.',
    'Av. Ibirapuera',
    '500',
    NULL,
    'Moema',
    'São Paulo',
    'SP',
    '04029-000',
    'PUBLISHED',
    4.7,
    85,
    now()
),
(
    'd0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'Basquete 3x3 Pinheiros',
    'basquete-3x3-pinheiros',
    'Quadra rápida outdoor iluminada ideal para partidas de basquete 3x3 e treino livre.',
    'Bebedouro e coletes inclusos no aluguel.',
    'Rua dos Pinheiros',
    '800',
    'Loja 4',
    'Pinheiros',
    'São Paulo',
    'SP',
    '05422-000',
    'PUBLISHED',
    4.6,
    42,
    now()
),
(
    'd0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000002',
    'Complexo Esportivo Batel',
    'complexo-esportivo-batel',
    'Quadras de futsal e vôlei de areia com lanchonete e vestiários climatizados.',
    'Necessário agendar com 1 hora de antecedência.',
    'Rua Batel',
    '300',
    NULL,
    'Batel',
    'São Paulo',
    'SP',
    '01423-000',
    'PUBLISHED',
    4.8,
    96,
    now()
)
ON CONFLICT (slug) DO NOTHING;

-- 8. COURT PHOTOS
INSERT INTO court_photos (id, court_id, storage_key, public_url, alt_text, sort_order, is_cover)
VALUES
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'photo-1', '/assets/images/court-futsal-real.jpg', 'Arena Vila Mariana', 0, true),
('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'photo-2', '/assets/images/court-beach-real.jpg', 'Ginásio Aurora', 0, true),
('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'photo-3', '/assets/images/hero-court-real.jpg', 'Basquete 3x3 Pinheiros', 0, true),
('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'photo-4', '/assets/images/court-volleyball-real.jpg', 'Complexo Esportivo Batel', 0, true)
ON CONFLICT DO NOTHING;

-- 9. COURT AMENITIES
INSERT INTO court_amenities (court_id, amenity_id)
VALUES
('d0000000-0000-0000-0000-000000000001', 1), -- Estacionamento
('d0000000-0000-0000-0000-000000000001', 2), -- Vestiario
('d0000000-0000-0000-0000-000000000001', 4), -- Iluminacao
('d0000000-0000-0000-0000-000000000001', 12), -- Coberta
('d0000000-0000-0000-0000-000000000002', 1), -- Estacionamento
('d0000000-0000-0000-0000-000000000002', 7), -- Acessibilidade
('d0000000-0000-0000-0000-000000000002', 8), -- Banheiro acessivel
('d0000000-0000-0000-0000-000000000003', 4), -- Iluminacao
('d0000000-0000-0000-0000-000000000003', 9), -- Bebedouro
('d0000000-0000-0000-0000-000000000004', 2), -- Vestiario
('d0000000-0000-0000-0000-000000000004', 6)  -- Wifi
ON CONFLICT DO NOTHING;

-- 10. COURT SPORTS
INSERT INTO court_sports (court_id, sport_id, price_per_hour, min_duration_minutes, max_participants)
VALUES
('d0000000-0000-0000-0000-000000000001', 2, 96.00, 60, 14), -- Futsal
('d0000000-0000-0000-0000-000000000001', 3, 90.00, 60, 12), -- Volei
('d0000000-0000-0000-0000-000000000002', 3, 110.00, 60, 12), -- Volei
('d0000000-0000-0000-0000-000000000002', 4, 100.00, 60, 10), -- Basquete
('d0000000-0000-0000-0000-000000000003', 4, 60.00, 60, 6),   -- Basquete
('d0000000-0000-0000-0000-000000000004', 2, 85.00, 60, 14), -- Futsal
('d0000000-0000-0000-0000-000000000004', 3, 80.00, 60, 12)  -- Volei
ON CONFLICT DO NOTHING;

-- 11. SAVED COURTS
INSERT INTO saved_courts (user_id, court_id)
VALUES
('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001'),
('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- 12. RENTAL REQUESTS
INSERT INTO rental_requests (id, court_id, sport_id, requester_id, team_id, requested_starts_at, requested_ends_at, participants, message, quoted_amount, currency, status, expires_at)
VALUES
(
    'f0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    3,
    'a0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    now() + INTERVAL '2 days',
    now() + INTERVAL '2 days' + INTERVAL '1 hour',
    12,
    'Reserva para treino semanal do time de vôlei.',
    96.00,
    'BRL',
    'ACCEPTED',
    now() + INTERVAL '1 day'
)
ON CONFLICT DO NOTHING;

-- 13. RESERVATIONS
INSERT INTO reservations (id, rental_request_id, court_id, sport_id, booked_by, team_id, confirmation_code, starts_at, ends_at, amount, currency, status)
VALUES
(
    'f1000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    3,
    'a0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'PQ-RES-2026-0001',
    now() + INTERVAL '2 days',
    now() + INTERVAL '2 days' + INTERVAL '1 hour',
    96.00,
    'BRL',
    'CONFIRMED'
)
ON CONFLICT (rental_request_id) DO NOTHING;

-- 14. PAYMENTS
INSERT INTO payments (id, reservation_id, payer_id, amount, currency)
VALUES
(
    'f2000000-0000-0000-0000-000000000001',
    'f1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    96.00,
    'BRL'
)
ON CONFLICT (reservation_id) DO NOTHING;

-- 15. CONVERSATIONS
INSERT INTO conversations (id, conversation_type, court_id, rental_request_id)
VALUES
(
    'f3000000-0000-0000-0000-000000000001',
    'RENTAL_REQUEST',
    'd0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- 16. CONVERSATION PARTICIPANTS
INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
VALUES
('f3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', now()),
('f3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', now())
ON CONFLICT DO NOTHING;

-- 17. MESSAGES
INSERT INTO messages (id, conversation_id, sender_id, body, sent_at)
VALUES
(
    'f4000000-0000-0000-0000-000000000001',
    'f3000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'Olá! Solicitação enviada para o treino de quinta-feira.',
    now() - INTERVAL '1 hour'
),
(
    'f4000000-0000-0000-0000-000000000002',
    'f3000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Perfeito, reserva confirmada. Aguardamos vocês!',
    now() - INTERVAL '30 minutes'
)
ON CONFLICT DO NOTHING;
