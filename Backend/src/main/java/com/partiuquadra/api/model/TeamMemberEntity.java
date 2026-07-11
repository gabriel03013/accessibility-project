package com.partiuquadra.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@IdClass(TeamMemberId.class)
@Table(name = "team_members")
public class TeamMemberEntity {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private TeamEntity team;

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_role", nullable = false, length = 20)
    private TeamMemberRole role = TeamMemberRole.MEMBER;

    @Column(name = "joined_at", nullable = false, insertable = false, updatable = false)
    private Instant joinedAt;

    public TeamEntity getTeam() {
        return team;
    }

    public void setTeam(TeamEntity team) {
        this.team = team;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public TeamMemberRole getRole() {
        return role;
    }

    public void setRole(TeamMemberRole role) {
        this.role = role;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }
}

