import SwiftUI

struct QuestsScreen: View {
    @EnvironmentObject var gameState: GameState
    
    private var dailyQuests: [Quest] {
        gameState.quests.filter { $0.type == .daily }
    }
    
    private var weeklyQuests: [Quest] {
        gameState.quests.filter { $0.type == .weekly }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                GameTheme.backgroundDark.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        gemsHeader
                        
                        questSection(title: "Daily Quests", icon: "sun.max.fill", color: GameTheme.accentGold, quests: dailyQuests)
                        
                        questSection(title: "Weekly Quests", icon: "calendar", color: GameTheme.accentPurple, quests: weeklyQuests)
                    }
                    .padding()
                }
            }
            .navigationTitle("Quests")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(GameTheme.backgroundDark, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
    }
    
    private var gemsHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Your Gems")
                    .font(.caption)
                    .foregroundStyle(GameTheme.textMuted)
                HStack(spacing: 6) {
                    Text("💎")
                    Text("\(gameState.gems)")
                        .font(.title2.bold())
                        .foregroundStyle(GameTheme.accentGold)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text("Streak")
                    .font(.caption)
                    .foregroundStyle(GameTheme.textMuted)
                HStack(spacing: 4) {
                    Image(systemName: "flame.fill")
                        .foregroundStyle(.orange)
                    Text("\(gameState.streakDays) days")
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                }
            }
        }
        .padding()
        .gameCard()
    }
    
    private func questSection(title: String, icon: String, color: Color, quests: [Quest]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Text(title)
                    .font(.headline.bold())
                    .foregroundStyle(.white)
            }
            
            ForEach(quests) { quest in
                QuestCard(quest: quest) {
                    gameState.claimQuest(quest)
                }
            }
        }
    }
}

struct QuestCard: View {
    let quest: Quest
    let onClaim: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(quest.title)
                        .font(.headline.bold())
                        .foregroundStyle(.white)
                    Text(quest.description)
                        .font(.caption)
                        .foregroundStyle(GameTheme.textSecondary)
                }
                Spacer()
                if quest.isClaimed {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(GameTheme.accentGreen)
                        .font(.title2)
                }
            }
            
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("\(quest.currentValue) / \(quest.targetValue)")
                        .font(.caption.bold())
                        .foregroundStyle(GameTheme.textSecondary)
                    Spacer()
                    Text("\(Int(quest.progress * 100))%")
                        .font(.caption2)
                        .foregroundStyle(GameTheme.textMuted)
                }
                
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.white.opacity(0.1))
                        Capsule()
                            .fill(quest.isComplete ? GameTheme.accentGreen : GameTheme.primaryGradient)
                            .frame(width: geo.size.width * quest.progress)
                    }
                }
                .frame(height: 8)
            }
            
            HStack {
                HStack(spacing: 4) {
                    Text("💎")
                    Text("+\(quest.gemReward)")
                        .font(.subheadline.bold())
                        .foregroundStyle(GameTheme.accentGold)
                }
                
                if let item = quest.itemReward {
                    Text("·")
                        .foregroundStyle(GameTheme.textMuted)
                    Text("🎁 \(item)")
                        .font(.caption)
                        .foregroundStyle(GameTheme.accentPurple)
                }
                
                Spacer()
                
                if quest.isComplete && !quest.isClaimed {
                    Button("Claim") { onClaim() }
                        .buttonStyle(GlowButtonStyle())
                } else if quest.isClaimed {
                    Text("Claimed")
                        .font(.caption.bold())
                        .foregroundStyle(GameTheme.textMuted)
                } else {
                    Text("In Progress")
                        .font(.caption.bold())
                        .foregroundStyle(GameTheme.textMuted)
                }
            }
        }
        .padding()
        .gameCard()
        .opacity(quest.isClaimed ? 0.7 : 1)
    }
}

#Preview {
    QuestsScreen()
        .environmentObject(GameState())
        .preferredColorScheme(.dark)
}
