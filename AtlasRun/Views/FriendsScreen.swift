import SwiftUI

struct FriendsScreen: View {
    @EnvironmentObject var gameState: GameState
    @State private var selectedFriend: Friend?
    @State private var showFriendProfile = false
    @State private var showChallengeAlert = false
    @State private var challengeFriend: Friend?
    
    var body: some View {
        NavigationStack {
            ZStack {
                GameTheme.backgroundDark.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        leaderboardSection
                        friendsListSection
                    }
                    .padding()
                }
            }
            .navigationTitle("Friends")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(GameTheme.backgroundDark, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        gameState.addFriend()
                    } label: {
                        Image(systemName: "person.badge.plus")
                            .foregroundStyle(GameTheme.accentGold)
                    }
                }
            }
            .sheet(isPresented: $showFriendProfile) {
                if let friend = selectedFriend {
                    FriendProfileSheet(friend: friend)
                        .environmentObject(gameState)
                }
            }
            .alert("Challenge Sent!", isPresented: $showChallengeAlert) {
                Button("OK", role: .cancel) {}
            } message: {
                if let friend = challengeFriend {
                    Text("You challenged \(friend.name) to a Ghost Run race this week!")
                }
            }
        }
    }
    
    private var leaderboardSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "trophy.fill")
                    .foregroundStyle(GameTheme.accentGold)
                Text("Weekly Leaderboard")
                    .font(.headline.bold())
                    .foregroundStyle(.white)
            }
            
            ForEach(gameState.weeklyLeaderboard) { entry in
                HStack(spacing: 12) {
                    Text(rankEmoji(entry.rank))
                        .font(.title3)
                        .frame(width: 32)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        HStack {
                            Text(entry.name)
                                .font(.subheadline.bold())
                                .foregroundStyle(entry.isCurrentUser ? GameTheme.accentGold : .white)
                            if entry.isCurrentUser {
                                Text("(You)")
                                    .font(.caption2)
                                    .foregroundStyle(GameTheme.textMuted)
                            }
                        }
                        Text(String(format: "%.1f mi this week", entry.weeklyMiles))
                            .font(.caption)
                            .foregroundStyle(GameTheme.textSecondary)
                    }
                    
                    Spacer()
                    
                    Text("#\(entry.rank)")
                        .font(.caption.bold())
                        .foregroundStyle(GameTheme.textMuted)
                }
                .padding(.vertical, 6)
                
                if entry.rank < gameState.weeklyLeaderboard.count {
                    Divider().background(GameTheme.cardBorder.opacity(0.3))
                }
            }
        }
        .padding()
        .gameCard()
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(GameTheme.accentGold.opacity(0.3), lineWidth: 1)
        )
    }
    
    private var friendsListSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Friends (\(gameState.friends.count))")
                    .font(.headline.bold())
                    .foregroundStyle(.white)
                Spacer()
                Button {
                    gameState.addFriend()
                } label: {
                    Label("Add Friend", systemImage: "plus")
                        .font(.caption.bold())
                }
                .buttonStyle(SecondaryButtonStyle())
            }
            
            if gameState.safeModeEnabled {
                HStack(spacing: 8) {
                    Image(systemName: "location.slash.fill")
                        .foregroundStyle(GameTheme.accentPurple)
                    Text("Safe Mode on: friends see approximate location only")
                        .font(.caption)
                        .foregroundStyle(GameTheme.textSecondary)
                }
                .padding(10)
                .background(RoundedRectangle(cornerRadius: 10).fill(GameTheme.accentPurple.opacity(0.15)))
            }
            
            ForEach(gameState.friends) { friend in
                FriendCard(
                    friend: friend,
                    onChallenge: {
                        challengeFriend = friend
                        showChallengeAlert = true
                    },
                    onViewProfile: {
                        selectedFriend = friend
                        showFriendProfile = true
                    }
                )
            }
        }
    }
    
    private func rankEmoji(_ rank: Int) -> String {
        switch rank {
        case 1: return "🥇"
        case 2: return "🥈"
        case 3: return "🥉"
        default: return "🏃"
        }
    }
}

struct FriendCard: View {
    let friend: Friend
    let onChallenge: () -> Void
    let onViewProfile: () -> Void
    
    var body: some View {
        HStack(spacing: 14) {
            ZStack(alignment: .bottomTrailing) {
                Text(friend.avatarEmoji)
                    .font(.system(size: 36))
                    .frame(width: 56, height: 56)
                    .background(Circle().fill(GameTheme.cardBackground))
                
                Circle()
                    .fill(friend.isOnline ? GameTheme.accentGreen : Color.gray)
                    .frame(width: 12, height: 12)
                    .overlay(Circle().stroke(GameTheme.backgroundDark, lineWidth: 2))
            }
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(friend.name)
                        .font(.headline.bold())
                        .foregroundStyle(.white)
                    Text("Lv.\(friend.level)")
                        .font(.caption.bold())
                        .foregroundStyle(GameTheme.accentGold)
                }
                HStack(spacing: 12) {
                    Label(String(format: "%.1f mi", friend.weeklyMiles), systemImage: "figure.run")
                    Label("\(friend.unlockedAreas) areas", systemImage: "map")
                }
                .font(.caption)
                .foregroundStyle(GameTheme.textSecondary)
            }
            
            Spacer()
        }
        .padding()
        .gameCard()
        .overlay(alignment: .bottom) {
            HStack(spacing: 8) {
                Button("Challenge") { onChallenge() }
                    .font(.caption.bold())
                    .foregroundStyle(GameTheme.accentPurple)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Capsule().stroke(GameTheme.accentPurple.opacity(0.5), lineWidth: 1))
                
                Button("Profile") { onViewProfile() }
                    .font(.caption.bold())
                    .foregroundStyle(GameTheme.accentBlue)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Capsule().stroke(GameTheme.accentBlue.opacity(0.5), lineWidth: 1))
            }
            .offset(y: 20)
        }
        .padding(.bottom, 16)
    }
}

struct FriendProfileSheet: View {
    @EnvironmentObject var gameState: GameState
    @Environment(\.dismiss) private var dismiss
    let friend: Friend
    
    var body: some View {
        NavigationStack {
            ZStack {
                GameTheme.backgroundDark.ignoresSafeArea()
                
                VStack(spacing: 24) {
                    Text(friend.avatarEmoji)
                        .font(.system(size: 64))
                    
                    Text(friend.name)
                        .font(.title.bold())
                        .foregroundStyle(.white)
                    
                    Text("Level \(friend.level)")
                        .font(.headline)
                        .foregroundStyle(GameTheme.accentGold)
                    
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        StatTile(icon: "figure.run", label: "Weekly Miles", value: String(format: "%.1f", friend.weeklyMiles), color: GameTheme.accentBlue)
                        StatTile(icon: "map.fill", label: "Unlocked Areas", value: "\(friend.unlockedAreas)", color: GameTheme.accentGreen)
                    }
                    .padding(.horizontal)
                    
                    if gameState.safeModeEnabled {
                        Text("Your location is hidden from friends")
                            .font(.caption)
                            .foregroundStyle(GameTheme.accentPurple)
                    }
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Runner Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(GameTheme.accentGold)
                }
            }
            .toolbarBackground(GameTheme.backgroundDark, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .presentationDetents([.medium, .large])
        .preferredColorScheme(.dark)
    }
}

#Preview {
    FriendsScreen()
        .environmentObject(GameState())
        .preferredColorScheme(.dark)
}
