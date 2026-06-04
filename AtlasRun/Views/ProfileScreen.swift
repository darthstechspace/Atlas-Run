import SwiftUI

struct ProfileScreen: View {
    @EnvironmentObject var gameState: GameState
    @State private var showCosmeticPicker = false
    @State private var selectedCategory: CosmeticCategory = .outfit
    
    var body: some View {
        NavigationStack {
            ZStack {
                GameTheme.backgroundDark.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        profileHeader
                        statsGrid
                        equippedSection
                        badgesSection
                        inventorySection
                        safetySection
                    }
                    .padding()
                }
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(GameTheme.backgroundDark, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .sheet(isPresented: $showCosmeticPicker) {
                CosmeticPickerSheet(category: selectedCategory)
                    .environmentObject(gameState)
            }
        }
    }
    
    private var profileHeader: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(GameTheme.primaryGradient)
                    .frame(width: 90, height: 90)
                    .shadow(color: GameTheme.accentPurple.opacity(0.5), radius: 12)
                
                Text(equippedEmoji)
                    .font(.system(size: 40))
            }
            
            if let banner = equippedItem(for: .banner) {
                Text("\(banner.emoji) \(banner.name)")
                    .font(.caption)
                    .foregroundStyle(GameTheme.accentPurple)
            }
            
            Text(gameState.username)
                .font(.title.bold())
                .foregroundStyle(.white)
            
            HStack(spacing: 8) {
                Text("Level \(gameState.level)")
                    .font(.headline)
                    .foregroundStyle(GameTheme.accentGold)
                if let pet = equippedItem(for: .pet) {
                    Text(pet.emoji)
                }
            }
            
            XPProgressBar(progress: gameState.xpProgress, level: gameState.level)
                .padding(.horizontal)
            
            Text("\(gameState.xp) / \(gameState.xpRequiredForNextLevel) XP")
                .font(.caption)
                .foregroundStyle(GameTheme.textSecondary)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .gameCard()
    }
    
    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatTile(icon: "figure.run", label: "Total Miles", value: String(format: "%.1f", gameState.totalMiles), color: GameTheme.accentBlue)
            StatTile(icon: "map.fill", label: "Areas Unlocked", value: "\(gameState.unlockedAreas.count)", color: GameTheme.accentGreen)
            StatTile(icon: "shippingbox.fill", label: "Chests Opened", value: "\(gameState.openedChests)", color: GameTheme.accentGold)
            StatTile(icon: "flame.fill", label: "Streak", value: "\(gameState.streakDays) days", color: .orange)
        }
    }
    
    private var equippedSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Equipped")
                .font(.headline.bold())
                .foregroundStyle(.white)
            
            ForEach(CosmeticCategory.allCases, id: \.self) { category in
                HStack {
                    Image(systemName: category.icon)
                        .foregroundStyle(GameTheme.accentBlue)
                        .frame(width: 24)
                    
                    Text(category.rawValue)
                        .font(.subheadline)
                        .foregroundStyle(GameTheme.textSecondary)
                    
                    Spacer()
                    
                    if let item = equippedItem(for: category) {
                        Text("\(item.emoji) \(item.name)")
                            .font(.caption.bold())
                            .foregroundStyle(.white)
                    } else {
                        Text("None")
                            .font(.caption)
                            .foregroundStyle(GameTheme.textMuted)
                    }
                    
                    Button {
                        selectedCategory = category
                        showCosmeticPicker = true
                    } label: {
                        Image(systemName: "pencil.circle.fill")
                            .foregroundStyle(GameTheme.accentGold)
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .padding()
        .gameCard()
    }
    
    private var badgesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Badges")
                    .font(.headline.bold())
                    .foregroundStyle(.white)
                Spacer()
                Text("\(gameState.badges.filter(\.isUnlocked).count)/\(gameState.badges.count)")
                    .font(.caption)
                    .foregroundStyle(GameTheme.textMuted)
            }
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4), spacing: 12) {
                ForEach(gameState.badges) { badge in
                    VStack(spacing: 4) {
                        Text(badge.emoji)
                            .font(.title2)
                            .opacity(badge.isUnlocked ? 1 : 0.25)
                            .grayscale(badge.isUnlocked ? 0 : 1)
                        Text(badge.name)
                            .font(.system(size: 9))
                            .foregroundStyle(badge.isUnlocked ? .white : GameTheme.textMuted)
                            .multilineTextAlignment(.center)
                            .lineLimit(2)
                    }
                }
            }
        }
        .padding()
        .gameCard()
    }
    
    private var inventorySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Cosmetics (\(gameState.cosmetics.count))")
                .font(.headline.bold())
                .foregroundStyle(.white)
            
            if gameState.cosmetics.isEmpty {
                Text("No cosmetics yet. Explore and visit the Shop!")
                    .font(.caption)
                    .foregroundStyle(GameTheme.textMuted)
            } else {
                ForEach(gameState.cosmetics) { item in
                    HStack {
                        Text(item.emoji)
                            .font(.title3)
                        VStack(alignment: .leading) {
                            Text(item.name)
                                .font(.subheadline.bold())
                                .foregroundStyle(.white)
                            Text(item.category.rawValue)
                                .font(.caption2)
                                .foregroundStyle(GameTheme.textMuted)
                        }
                        Spacer()
                        if gameState.isEquipped(item) {
                            Text("Equipped")
                                .font(.caption2.bold())
                                .foregroundStyle(GameTheme.accentGreen)
                        } else {
                            Button("Equip") {
                                gameState.equipCosmetic(item)
                            }
                            .font(.caption.bold())
                            .foregroundStyle(GameTheme.accentGold)
                        }
                    }
                }
            }
        }
        .padding()
        .gameCard()
    }
    
    private var safetySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Safety")
                .font(.headline.bold())
                .foregroundStyle(.white)
            
            Toggle(isOn: $gameState.safeModeEnabled) {
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Image(systemName: "location.slash.fill")
                            .foregroundStyle(GameTheme.accentPurple)
                        Text("Safe Mode")
                            .font(.subheadline.bold())
                            .foregroundStyle(.white)
                    }
                    Text("Approximate location only when synced; exact GPS stays on your device.")
                        .font(.caption2)
                        .foregroundStyle(GameTheme.textMuted)
                }
            }
            .tint(GameTheme.accentPurple)
            
            Toggle(isOn: $gameState.playSafetyAlertsEnabled) {
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Image(systemName: "exclamationmark.shield.fill")
                            .foregroundStyle(GameTheme.accentPurple)
                        Text("Play safety alerts")
                            .font(.subheadline.bold())
                            .foregroundStyle(.white)
                    }
                    Text("Warn when moving too fast or while driving.")
                        .font(.caption2)
                        .foregroundStyle(GameTheme.textMuted)
                }
            }
            .tint(GameTheme.accentPurple)
            
            Text("Stay aware of your surroundings. Never play while driving. Pause if you are moving too fast.")
                .font(.caption2)
                .foregroundStyle(GameTheme.textSecondary)
        }
        .padding()
        .gameCard()
    }
    
    private var equippedEmoji: String {
        if let outfit = equippedItem(for: .outfit) { return outfit.emoji }
        return "🏃"
    }
    
    private func equippedItem(for category: CosmeticCategory) -> CosmeticItem? {
        let id: UUID?
        switch category {
        case .outfit: id = gameState.equipped.outfit
        case .hat: id = gameState.equipped.hat
        case .shoes: id = gameState.equipped.shoes
        case .banner: id = gameState.equipped.banner
        case .trailEffect: id = gameState.equipped.trailEffect
        case .pet: id = gameState.equipped.pet
        }
        guard let itemId = id else { return nil }
        return gameState.cosmetics.first { $0.id == itemId }
    }
}

struct StatTile: View {
    let icon: String
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
            Text(value)
                .font(.headline.bold())
                .foregroundStyle(.white)
            Text(label)
                .font(.caption2)
                .foregroundStyle(GameTheme.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .gameCard()
    }
}

struct CosmeticPickerSheet: View {
    @EnvironmentObject var gameState: GameState
    @Environment(\.dismiss) private var dismiss
    let category: CosmeticCategory
    
    private var items: [CosmeticItem] {
        gameState.cosmetics.filter { $0.category == category }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                GameTheme.backgroundDark.ignoresSafeArea()
                
                if items.isEmpty {
                    VStack(spacing: 12) {
                        Text("No \(category.rawValue.lowercased()) items owned")
                            .foregroundStyle(GameTheme.textSecondary)
                        Text("Visit the Shop to buy cosmetics!")
                            .font(.caption)
                            .foregroundStyle(GameTheme.textMuted)
                    }
                } else {
                    List(items) { item in
                        Button {
                            gameState.equipCosmetic(item)
                            dismiss()
                        } label: {
                            HStack {
                                Text(item.emoji)
                                    .font(.title2)
                                Text(item.name)
                                    .foregroundStyle(.white)
                                Spacer()
                                if gameState.isEquipped(item) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(GameTheme.accentGreen)
                                }
                            }
                        }
                        .listRowBackground(GameTheme.cardBackground)
                    }
                    .scrollContentBackground(.hidden)
                }
            }
            .navigationTitle("Equip \(category.rawValue)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(GameTheme.accentGold)
                }
            }
            .toolbarBackground(GameTheme.backgroundDark, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .presentationDetents([.medium])
        .preferredColorScheme(.dark)
    }
}

#Preview {
    ProfileScreen()
        .environmentObject(GameState())
        .preferredColorScheme(.dark)
}
