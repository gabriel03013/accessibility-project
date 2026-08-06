BEGIN;

SET search_path TO app;

INSERT INTO users (
    id,
    email,
    username,
    password_hash,
    display_name,
    phone,
    account_type
) VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        'rafael.owner@teste.local',
        'rafael.owner',
        '$2a$12$6uOKtpKc/sURukbMJ5HZt.Vp5Di8zpvpOE7XMfRqN5BrZb0Nj3YOq',
        'Rafael Martins',
        '(11) 99120-3040',
        'OWNER'
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'mariana.owner@teste.local',
        'mariana.owner',
        '$2a$12$6uOKtpKc/sURukbMJ5HZt.Vp5Di8zpvpOE7XMfRqN5BrZb0Nj3YOq',
        'Mariana Costa',
        '(19) 99214-8870',
        'OWNER'
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'gabriel.player@teste.local',
        'gabriel.player',
        '$2a$12$6uOKtpKc/sURukbMJ5HZt.Vp5Di8zpvpOE7XMfRqN5BrZb0Nj3YOq',
        'Gabriel Silva',
        '(11) 98842-1150',
        'PLAYER'
    ),
    (
        '10000000-0000-0000-0000-000000000004',
        'ana.player@teste.local',
        'ana.player',
        '$2a$12$6uOKtpKc/sURukbMJ5HZt.Vp5Di8zpvpOE7XMfRqN5BrZb0Nj3YOq',
        'Ana Beatriz',
        '(11) 99730-4612',
        'PLAYER'
    ),
    (
        '10000000-0000-0000-0000-000000000005',
        'bruno.player@teste.local',
        'bruno.player',
        '$2a$12$6uOKtpKc/sURukbMJ5HZt.Vp5Di8zpvpOE7XMfRqN5BrZb0Nj3YOq',
        'Bruno Lima',
        '(13) 99650-2281',
        'PLAYER'
    ),
    (
        '10000000-0000-0000-0000-000000000006',
        'luiza.player@teste.local',
        'luiza.player',
        '$2a$12$6uOKtpKc/sURukbMJ5HZt.Vp5Di8zpvpOE7XMfRqN5BrZb0Nj3YOq',
        'Luiza Ferreira',
        '(15) 99442-9033',
        'PLAYER'
    )
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    phone = EXCLUDED.phone,
    account_type = EXCLUDED.account_type;

INSERT INTO user_favorite_sports (user_id, sport_id)
SELECT favorite.user_id, sport.id
FROM (
    VALUES
        ('10000000-0000-0000-0000-000000000003'::uuid, 'futsal'),
        ('10000000-0000-0000-0000-000000000003'::uuid, 'futebol'),
        ('10000000-0000-0000-0000-000000000004'::uuid, 'volei'),
        ('10000000-0000-0000-0000-000000000004'::uuid, 'futsal'),
        ('10000000-0000-0000-0000-000000000005'::uuid, 'basquete'),
        ('10000000-0000-0000-0000-000000000005'::uuid, 'handebol'),
        ('10000000-0000-0000-0000-000000000006'::uuid, 'tenis'),
        ('10000000-0000-0000-0000-000000000006'::uuid, 'padel')
) AS favorite(user_id, sport_slug)
JOIN sports sport ON sport.slug = favorite.sport_slug
ON CONFLICT DO NOTHING;

INSERT INTO teams (
    id,
    created_by,
    name,
    slug,
    description,
    skill_level,
    routine,
    max_members,
    public_profile,
    status
) VALUES
    (
        '11000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000003',
        'Lobos da Vila',
        'lobos-da-vila',
        'Turma de amigos que joga futsal com intensidade, respeito e espaço para novos jogadores.',
        'INTERMEDIATE',
        'Terças e quintas, das 20h às 22h.',
        16,
        true,
        'ACTIVE'
    ),
    (
        '11000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000004',
        'Vôlei de Quinta',
        'volei-de-quinta',
        'Grupo misto para quem gosta de vôlei e também topa uma partida de futsal no fim de semana.',
        'MIXED',
        'Quintas, às 19h30.',
        20,
        true,
        'ACTIVE'
    ),
    (
        '11000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000006',
        'Raquete Campinas',
        'raquete-campinas',
        'Jogadores de tênis e padel que se encontram para partidas amistosas e pequenos torneios.',
        'INTERMEDIATE',
        'Sábados pela manhã.',
        12,
        true,
        'ACTIVE'
    )
ON CONFLICT (id) DO UPDATE SET
    created_by = EXCLUDED.created_by,
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    skill_level = EXCLUDED.skill_level,
    routine = EXCLUDED.routine,
    max_members = EXCLUDED.max_members,
    public_profile = EXCLUDED.public_profile,
    status = EXCLUDED.status;

INSERT INTO team_sports (team_id, sport_id)
SELECT selection.team_id, sport.id
FROM (
    VALUES
        ('11000000-0000-0000-0000-000000000001'::uuid, 'futsal'),
        ('11000000-0000-0000-0000-000000000001'::uuid, 'futebol'),
        ('11000000-0000-0000-0000-000000000002'::uuid, 'volei'),
        ('11000000-0000-0000-0000-000000000002'::uuid, 'futsal'),
        ('11000000-0000-0000-0000-000000000003'::uuid, 'tenis'),
        ('11000000-0000-0000-0000-000000000003'::uuid, 'padel')
) AS selection(team_id, sport_slug)
JOIN sports sport ON sport.slug = selection.sport_slug
ON CONFLICT DO NOTHING;

INSERT INTO team_members (team_id, user_id, member_role, joined_at) VALUES
    (
        '11000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000003',
        'ADMIN',
        now() - interval '120 days'
    ),
    (
        '11000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000004',
        'MEMBER',
        now() - interval '90 days'
    ),
    (
        '11000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000005',
        'MEMBER',
        now() - interval '70 days'
    ),
    (
        '11000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000004',
        'ADMIN',
        now() - interval '150 days'
    ),
    (
        '11000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000006',
        'MEMBER',
        now() - interval '40 days'
    ),
    (
        '11000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000006',
        'ADMIN',
        now() - interval '80 days'
    ),
    (
        '11000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000003',
        'MEMBER',
        now() - interval '25 days'
    )
ON CONFLICT (team_id, user_id) DO UPDATE SET
    member_role = EXCLUDED.member_role;

INSERT INTO team_invitations (
    id,
    team_id,
    invited_user_id,
    invited_username,
    invited_by,
    message,
    status,
    expires_at
) VALUES (
    '12000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000006',
    'luiza.player',
    '10000000-0000-0000-0000-000000000003',
    'Luiza, aparece para jogar com a gente na próxima quinta!',
    'PENDING',
    now() + interval '7 days'
)
ON CONFLICT (id) DO UPDATE SET
    status = 'PENDING',
    expires_at = EXCLUDED.expires_at,
    responded_at = NULL;

INSERT INTO courts (
    id,
    owner_id,
    name,
    slug,
    description,
    observation,
    address_line,
    address_number,
    address_complement,
    neighborhood,
    city,
    state,
    postal_code,
    timezone,
    status,
    average_rating,
    review_count,
    published_at
) VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'Arena do Vale',
        'arena-do-vale',
        'Quadra de grama sintética bem cuidada, com iluminação forte e espaço confortável para reunir o time antes e depois do jogo.',
        'Chegue com 15 minutos de antecedência. O local empresta coletes e uma bola sem custo.',
        'Rua Domingos de Morais',
        '1840',
        'Entrada pelo portão lateral',
        'Vila Mariana',
        'São Paulo',
        'SP',
        '04010-200',
        'America/Sao_Paulo',
        'PUBLISHED',
        4.8,
        126,
        now() - interval '300 days'
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        'Quadra Aurora',
        'quadra-aurora',
        'Espaço coberto e arejado para basquete e vôlei, com piso novo, arquibancada pequena e acesso fácil por transporte público.',
        'A rede de vôlei é montada pela equipe do local antes do horário reservado.',
        'Rua dos Pinheiros',
        '930',
        NULL,
        'Pinheiros',
        'São Paulo',
        'SP',
        '05422-001',
        'America/Sao_Paulo',
        'PUBLISHED',
        4.6,
        84,
        now() - interval '220 days'
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000002',
        'Clube Horizonte',
        'clube-horizonte',
        'Duas quadras rápidas em uma área tranquila de Campinas, com vestiário, estacionamento e uma varanda para acompanhar as partidas.',
        'Raquetes não estão incluídas. Bolas podem ser compradas na recepção.',
        'Rua Coronel Quirino',
        '1510',
        'Bloco B',
        'Cambuí',
        'Campinas',
        'SP',
        '13025-002',
        'America/Sao_Paulo',
        'PUBLISHED',
        4.9,
        63,
        now() - interval '180 days'
    ),
    (
        '20000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000002',
        'Arena da Praia',
        'arena-da-praia',
        'Areia macia, duchas e clima descontraído a poucas quadras da orla. Ideal para beach tennis e futevôlei no fim da tarde.',
        'Em caso de chuva forte, a reserva pode ser remarcada sem custo.',
        'Avenida Ana Costa',
        '420',
        NULL,
        'Gonzaga',
        'Santos',
        'SP',
        '11060-002',
        'America/Sao_Paulo',
        'PUBLISHED',
        4.7,
        97,
        now() - interval '160 days'
    ),
    (
        '20000000-0000-0000-0000-000000000005',
        '10000000-0000-0000-0000-000000000001',
        'Ginásio Central',
        'ginasio-central',
        'Ginásio de bairro com quadra oficial, placar eletrônico simples e boa estrutura para treinos, amistosos e campeonatos pequenos.',
        'O estacionamento tem vagas limitadas durante a semana.',
        'Rua da Mooca',
        '2380',
        NULL,
        'Mooca',
        'São Paulo',
        'SP',
        '03104-002',
        'America/Sao_Paulo',
        'PUBLISHED',
        4.5,
        51,
        now() - interval '130 days'
    ),
    (
        '20000000-0000-0000-0000-000000000006',
        '10000000-0000-0000-0000-000000000002',
        'Espaço Ipê',
        'espaco-ipe',
        'Quadra multiuso cercada por árvores, com ambiente familiar, banheiro acessível e área de convivência ao lado.',
        'A churrasqueira precisa ser solicitada com pelo menos um dia de antecedência.',
        'Avenida Antônio Carlos Comitre',
        '980',
        'Fundos',
        'Campolim',
        'Sorocaba',
        'SP',
        '18047-620',
        'America/Sao_Paulo',
        'PUBLISHED',
        4.8,
        39,
        now() - interval '110 days'
    )
ON CONFLICT (id) DO UPDATE SET
    owner_id = EXCLUDED.owner_id,
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    observation = EXCLUDED.observation,
    address_line = EXCLUDED.address_line,
    address_number = EXCLUDED.address_number,
    address_complement = EXCLUDED.address_complement,
    neighborhood = EXCLUDED.neighborhood,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    postal_code = EXCLUDED.postal_code,
    timezone = EXCLUDED.timezone,
    status = EXCLUDED.status,
    average_rating = EXCLUDED.average_rating,
    review_count = EXCLUDED.review_count,
    published_at = EXCLUDED.published_at;

INSERT INTO court_photos (
    id,
    court_id,
    storage_key,
    public_url,
    alt_text,
    sort_order,
    is_cover
) VALUES
    (
        '30000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        'test/arena-do-vale-cover',
        'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1400&q=80',
        'Quadra de futebol com grama sintética e linhas brancas',
        0,
        true
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        '20000000-0000-0000-0000-000000000001',
        'test/arena-do-vale-detail',
        'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1400&q=80',
        'Bola de futebol no gramado da quadra',
        1,
        false
    ),
    (
        '30000000-0000-0000-0000-000000000003',
        '20000000-0000-0000-0000-000000000002',
        'test/quadra-aurora-cover',
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1400&q=80',
        'Quadra coberta preparada para uma partida de basquete',
        0,
        true
    ),
    (
        '30000000-0000-0000-0000-000000000004',
        '20000000-0000-0000-0000-000000000003',
        'test/clube-horizonte-cover',
        'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1400&q=80',
        'Quadra de tênis vista junto à rede',
        0,
        true
    ),
    (
        '30000000-0000-0000-0000-000000000005',
        '20000000-0000-0000-0000-000000000004',
        'test/arena-da-praia-cover',
        'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1400&q=80',
        'Quadra de areia preparada para esporte ao ar livre',
        0,
        true
    ),
    (
        '30000000-0000-0000-0000-000000000006',
        '20000000-0000-0000-0000-000000000005',
        'test/ginasio-central-cover',
        'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1400&q=80',
        'Ginásio com quadra e arquibancada',
        0,
        true
    ),
    (
        '30000000-0000-0000-0000-000000000007',
        '20000000-0000-0000-0000-000000000006',
        'test/espaco-ipe-cover',
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80',
        'Quadra multiuso em uma área arborizada',
        0,
        true
    )
ON CONFLICT (id) DO UPDATE SET
    public_url = EXCLUDED.public_url,
    alt_text = EXCLUDED.alt_text,
    sort_order = EXCLUDED.sort_order,
    is_cover = EXCLUDED.is_cover;

INSERT INTO court_amenities (court_id, amenity_id)
SELECT selection.court_id, amenity.id
FROM (
    VALUES
        ('20000000-0000-0000-0000-000000000001'::uuid, 'estacionamento'),
        ('20000000-0000-0000-0000-000000000001'::uuid, 'vestiario'),
        ('20000000-0000-0000-0000-000000000001'::uuid, 'iluminacao'),
        ('20000000-0000-0000-0000-000000000001'::uuid, 'coletes'),
        ('20000000-0000-0000-0000-000000000001'::uuid, 'bola'),
        ('20000000-0000-0000-0000-000000000002'::uuid, 'coberta'),
        ('20000000-0000-0000-0000-000000000002'::uuid, 'arquibancada'),
        ('20000000-0000-0000-0000-000000000002'::uuid, 'bebedouro'),
        ('20000000-0000-0000-0000-000000000002'::uuid, 'acessibilidade'),
        ('20000000-0000-0000-0000-000000000003'::uuid, 'estacionamento'),
        ('20000000-0000-0000-0000-000000000003'::uuid, 'vestiario'),
        ('20000000-0000-0000-0000-000000000003'::uuid, 'chuveiro'),
        ('20000000-0000-0000-0000-000000000003'::uuid, 'wifi'),
        ('20000000-0000-0000-0000-000000000004'::uuid, 'chuveiro'),
        ('20000000-0000-0000-0000-000000000004'::uuid, 'bebedouro'),
        ('20000000-0000-0000-0000-000000000004'::uuid, 'iluminacao'),
        ('20000000-0000-0000-0000-000000000005'::uuid, 'coberta'),
        ('20000000-0000-0000-0000-000000000005'::uuid, 'arquibancada'),
        ('20000000-0000-0000-0000-000000000005'::uuid, 'estacionamento'),
        ('20000000-0000-0000-0000-000000000005'::uuid, 'banheiro-acessivel'),
        ('20000000-0000-0000-0000-000000000006'::uuid, 'acessibilidade'),
        ('20000000-0000-0000-0000-000000000006'::uuid, 'banheiro-acessivel'),
        ('20000000-0000-0000-0000-000000000006'::uuid, 'churrasqueira'),
        ('20000000-0000-0000-0000-000000000006'::uuid, 'estacionamento')
) AS selection(court_id, amenity_slug)
JOIN amenities amenity ON amenity.slug = selection.amenity_slug
ON CONFLICT DO NOTHING;

INSERT INTO court_sports (
    court_id,
    sport_id,
    price_per_hour,
    min_duration_minutes,
    max_participants
)
SELECT
    selection.court_id,
    sport.id,
    selection.price_per_hour,
    selection.min_duration_minutes,
    selection.max_participants
FROM (
    VALUES
        ('20000000-0000-0000-0000-000000000001'::uuid, 'futsal', 120.00, 60::smallint, 14::smallint),
        ('20000000-0000-0000-0000-000000000001'::uuid, 'futebol', 140.00, 60::smallint, 18::smallint),
        ('20000000-0000-0000-0000-000000000002'::uuid, 'basquete', 95.00, 60::smallint, 14::smallint),
        ('20000000-0000-0000-0000-000000000002'::uuid, 'volei', 90.00, 60::smallint, 14::smallint),
        ('20000000-0000-0000-0000-000000000003'::uuid, 'tenis', 150.00, 60::smallint, 4::smallint),
        ('20000000-0000-0000-0000-000000000003'::uuid, 'padel', 160.00, 60::smallint, 4::smallint),
        ('20000000-0000-0000-0000-000000000004'::uuid, 'beach-tennis', 110.00, 60::smallint, 6::smallint),
        ('20000000-0000-0000-0000-000000000004'::uuid, 'futevolei', 105.00, 60::smallint, 8::smallint),
        ('20000000-0000-0000-0000-000000000005'::uuid, 'basquete', 130.00, 60::smallint, 16::smallint),
        ('20000000-0000-0000-0000-000000000005'::uuid, 'handebol', 135.00, 60::smallint, 18::smallint),
        ('20000000-0000-0000-0000-000000000005'::uuid, 'futsal', 125.00, 60::smallint, 14::smallint),
        ('20000000-0000-0000-0000-000000000006'::uuid, 'volei', 85.00, 60::smallint, 14::smallint),
        ('20000000-0000-0000-0000-000000000006'::uuid, 'futsal', 100.00, 60::smallint, 14::smallint)
) AS selection(
    court_id,
    sport_slug,
    price_per_hour,
    min_duration_minutes,
    max_participants
)
JOIN sports sport ON sport.slug = selection.sport_slug
ON CONFLICT (court_id, sport_id) DO UPDATE SET
    price_per_hour = EXCLUDED.price_per_hour,
    min_duration_minutes = EXCLUDED.min_duration_minutes,
    max_participants = EXCLUDED.max_participants;

INSERT INTO saved_courts (user_id, court_id) VALUES
    (
        '10000000-0000-0000-0000-000000000003',
        '20000000-0000-0000-0000-000000000001'
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        '20000000-0000-0000-0000-000000000003'
    ),
    (
        '10000000-0000-0000-0000-000000000004',
        '20000000-0000-0000-0000-000000000002'
    ),
    (
        '10000000-0000-0000-0000-000000000005',
        '20000000-0000-0000-0000-000000000005'
    )
ON CONFLICT DO NOTHING;

INSERT INTO team_challenges (
    id,
    challenger_team_id,
    challenged_team_id,
    sport_id,
    created_by,
    message,
    status,
    expires_at
)
SELECT
    '40000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000002',
    sport.id,
    '10000000-0000-0000-0000-000000000003',
    'Que tal um amistoso na próxima semana? A gente fecha a quadra e divide o valor.',
    'NEGOTIATING',
    now() + interval '10 days'
FROM sports sport
WHERE sport.slug = 'futsal'
ON CONFLICT (id) DO UPDATE SET
    status = 'NEGOTIATING',
    expires_at = EXCLUDED.expires_at;

INSERT INTO challenge_proposals (
    id,
    challenge_id,
    proposed_by_team_id,
    court_id,
    starts_at,
    ends_at,
    message,
    status
) VALUES (
    '41000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    date_trunc('day', now()) + interval '8 days 20 hours',
    date_trunc('day', now()) + interval '8 days 21 hours',
    'Pode ser na Arena do Vale às 20h?',
    'PENDING'
)
ON CONFLICT (id) DO UPDATE SET
    starts_at = EXCLUDED.starts_at,
    ends_at = EXCLUDED.ends_at,
    status = EXCLUDED.status;

INSERT INTO rental_requests (
    id,
    court_id,
    sport_id,
    requester_id,
    team_id,
    requested_starts_at,
    requested_ends_at,
    participants,
    message,
    quoted_amount,
    currency,
    status,
    expires_at,
    responded_at
)
SELECT
    request_data.id,
    request_data.court_id,
    sport.id,
    request_data.requester_id,
    request_data.team_id,
    date_trunc('day', now()) + request_data.start_offset,
    date_trunc('day', now()) + request_data.end_offset,
    request_data.participants,
    request_data.message,
    request_data.quoted_amount,
    'BRL',
    request_data.status,
    now() + request_data.expiration_offset,
    request_data.responded_at
FROM (
    VALUES
        (
            '50000000-0000-0000-0000-000000000001'::uuid,
            '20000000-0000-0000-0000-000000000001'::uuid,
            'futsal',
            '10000000-0000-0000-0000-000000000003'::uuid,
            '11000000-0000-0000-0000-000000000001'::uuid,
            interval '3 days 19 hours',
            interval '3 days 20 hours',
            12::smallint,
            'Vamos em 12 pessoas e levamos nossa própria bola.',
            120.00,
            'PENDING',
            interval '2 days',
            NULL::timestamptz
        ),
        (
            '50000000-0000-0000-0000-000000000002'::uuid,
            '20000000-0000-0000-0000-000000000002'::uuid,
            'volei',
            '10000000-0000-0000-0000-000000000004'::uuid,
            '11000000-0000-0000-0000-000000000002'::uuid,
            interval '4 days 20 hours',
            interval '4 days 21 hours',
            10::smallint,
            'Precisamos da rede montada para o começo do horário.',
            90.00,
            'ACCEPTED',
            interval '3 days',
            now() - interval '30 minutes'
        ),
        (
            '50000000-0000-0000-0000-000000000003'::uuid,
            '20000000-0000-0000-0000-000000000001'::uuid,
            'futsal',
            '10000000-0000-0000-0000-000000000003'::uuid,
            '11000000-0000-0000-0000-000000000001'::uuid,
            interval '2 days 21 hours',
            interval '2 days 22 hours',
            12::smallint,
            'Partida semanal do time.',
            120.00,
            'ACCEPTED',
            interval '1 day',
            now() - interval '1 hour'
        ),
        (
            '50000000-0000-0000-0000-000000000004'::uuid,
            '20000000-0000-0000-0000-000000000005'::uuid,
            'basquete',
            '10000000-0000-0000-0000-000000000005'::uuid,
            NULL::uuid,
            interval '5 days 18 hours',
            interval '5 days 20 hours',
            10::smallint,
            'Treino de duas horas para o grupo.',
            260.00,
            'ACCEPTED',
            interval '4 days',
            now() - interval '2 hours'
        ),
        (
            '50000000-0000-0000-0000-000000000005'::uuid,
            '20000000-0000-0000-0000-000000000003'::uuid,
            'tenis',
            '10000000-0000-0000-0000-000000000006'::uuid,
            '11000000-0000-0000-0000-000000000003'::uuid,
            interval '6 days 9 hours',
            interval '6 days 10 hours',
            2::smallint,
            'Preferimos o primeiro horário da manhã, se estiver disponível.',
            150.00,
            'COUNTER_PROPOSED',
            interval '5 days',
            now() - interval '20 minutes'
        )
) AS request_data(
    id,
    court_id,
    sport_slug,
    requester_id,
    team_id,
    start_offset,
    end_offset,
    participants,
    message,
    quoted_amount,
    status,
    expiration_offset,
    responded_at
)
JOIN sports sport ON sport.slug = request_data.sport_slug
ON CONFLICT (id) DO UPDATE SET
    requested_starts_at = EXCLUDED.requested_starts_at,
    requested_ends_at = EXCLUDED.requested_ends_at,
    participants = EXCLUDED.participants,
    message = EXCLUDED.message,
    quoted_amount = EXCLUDED.quoted_amount,
    status = EXCLUDED.status,
    expires_at = EXCLUDED.expires_at,
    responded_at = EXCLUDED.responded_at;

INSERT INTO rental_request_proposals (
    id,
    rental_request_id,
    proposed_by,
    starts_at,
    ends_at,
    amount,
    message,
    status
) VALUES (
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000002',
    date_trunc('day', now()) + interval '6 days 10 hours',
    date_trunc('day', now()) + interval '6 days 11 hours',
    150.00,
    'Às 9h já está reservado, mas consigo liberar a quadra às 10h.',
    'PENDING'
)
ON CONFLICT (id) DO UPDATE SET
    starts_at = EXCLUDED.starts_at,
    ends_at = EXCLUDED.ends_at,
    amount = EXCLUDED.amount,
    message = EXCLUDED.message,
    status = EXCLUDED.status;

INSERT INTO reservations (
    id,
    rental_request_id,
    court_id,
    sport_id,
    booked_by,
    team_id,
    confirmation_code,
    starts_at,
    ends_at,
    amount,
    currency,
    status
)
SELECT
    reservation_data.id,
    reservation_data.rental_request_id,
    reservation_data.court_id,
    sport.id,
    reservation_data.booked_by,
    reservation_data.team_id,
    reservation_data.confirmation_code,
    date_trunc('day', now()) + reservation_data.start_offset,
    date_trunc('day', now()) + reservation_data.end_offset,
    reservation_data.amount,
    'BRL',
    reservation_data.status
FROM (
    VALUES
        (
            '70000000-0000-0000-0000-000000000001'::uuid,
            '50000000-0000-0000-0000-000000000002'::uuid,
            '20000000-0000-0000-0000-000000000002'::uuid,
            'volei',
            '10000000-0000-0000-0000-000000000004'::uuid,
            '11000000-0000-0000-0000-000000000002'::uuid,
            'PQTESTE000001',
            interval '4 days 20 hours',
            interval '4 days 21 hours',
            90.00,
            'AWAITING_PAYMENT'
        ),
        (
            '70000000-0000-0000-0000-000000000002'::uuid,
            '50000000-0000-0000-0000-000000000003'::uuid,
            '20000000-0000-0000-0000-000000000001'::uuid,
            'futsal',
            '10000000-0000-0000-0000-000000000003'::uuid,
            '11000000-0000-0000-0000-000000000001'::uuid,
            'PQTESTE000002',
            interval '2 days 21 hours',
            interval '2 days 22 hours',
            120.00,
            'CONFIRMED'
        ),
        (
            '70000000-0000-0000-0000-000000000003'::uuid,
            '50000000-0000-0000-0000-000000000004'::uuid,
            '20000000-0000-0000-0000-000000000005'::uuid,
            'basquete',
            '10000000-0000-0000-0000-000000000005'::uuid,
            NULL::uuid,
            'PQTESTE000003',
            interval '5 days 18 hours',
            interval '5 days 20 hours',
            260.00,
            'CONFIRMED'
        )
) AS reservation_data(
    id,
    rental_request_id,
    court_id,
    sport_slug,
    booked_by,
    team_id,
    confirmation_code,
    start_offset,
    end_offset,
    amount,
    status
)
JOIN sports sport ON sport.slug = reservation_data.sport_slug
ON CONFLICT (id) DO UPDATE SET
    starts_at = EXCLUDED.starts_at,
    ends_at = EXCLUDED.ends_at,
    amount = EXCLUDED.amount,
    status = EXCLUDED.status;

INSERT INTO payments (
    id,
    reservation_id,
    payer_id,
    amount,
    currency,
    created_at
) VALUES
    (
        '80000000-0000-0000-0000-000000000001',
        '70000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000003',
        120.00,
        'BRL',
        now() - interval '1 hour'
    ),
    (
        '80000000-0000-0000-0000-000000000002',
        '70000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000005',
        260.00,
        'BRL',
        now() - interval '2 hours'
    )
ON CONFLICT (id) DO UPDATE SET
    amount = EXCLUDED.amount,
    currency = EXCLUDED.currency;

INSERT INTO conversations (
    id,
    conversation_type,
    court_id,
    rental_request_id,
    challenge_id,
    created_at
) VALUES
    (
        '90000000-0000-0000-0000-000000000001',
        'COURT_BOOKING',
        '20000000-0000-0000-0000-000000000001',
        '50000000-0000-0000-0000-000000000003',
        NULL,
        now() - interval '2 days'
    ),
    (
        '90000000-0000-0000-0000-000000000002',
        'TEAM_CHALLENGE',
        '20000000-0000-0000-0000-000000000001',
        NULL,
        '40000000-0000-0000-0000-000000000001',
        now() - interval '1 day'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO conversation_participants (
    conversation_id,
    user_id,
    joined_at,
    last_read_at,
    muted
) VALUES
    (
        '90000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000003',
        now() - interval '2 days',
        now() - interval '20 minutes',
        false
    ),
    (
        '90000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        now() - interval '2 days',
        now() - interval '45 minutes',
        false
    ),
    (
        '90000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000003',
        now() - interval '1 day',
        now() - interval '2 hours',
        false
    ),
    (
        '90000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000004',
        now() - interval '1 day',
        now() - interval '1 hour',
        false
    )
ON CONFLICT (conversation_id, user_id) DO UPDATE SET
    last_read_at = EXCLUDED.last_read_at,
    muted = EXCLUDED.muted;

INSERT INTO messages (
    id,
    conversation_id,
    sender_id,
    body,
    sent_at
) VALUES
    (
        '91000000-0000-0000-0000-000000000001',
        '90000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000003',
        'Oi, Rafael! A reserva de quinta está confirmada para o nosso time?',
        now() - interval '50 minutes'
    ),
    (
        '91000000-0000-0000-0000-000000000002',
        '90000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'Está sim, Gabriel. Deixei os coletes separados para vocês.',
        now() - interval '42 minutes'
    ),
    (
        '91000000-0000-0000-0000-000000000003',
        '90000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000003',
        'Perfeito, obrigado! Chegaremos um pouco antes.',
        now() - interval '35 minutes'
    ),
    (
        '91000000-0000-0000-0000-000000000004',
        '90000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000003',
        'Ana, mandei o desafio para a próxima semana. O horário funciona para vocês?',
        now() - interval '5 hours'
    ),
    (
        '91000000-0000-0000-0000-000000000005',
        '90000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000004',
        'Funciona! Propus a Arena do Vale às 20h. Vou confirmar com o restante do time.',
        now() - interval '4 hours'
    )
ON CONFLICT (id) DO UPDATE SET
    body = EXCLUDED.body,
    sent_at = EXCLUDED.sent_at;

COMMIT;
