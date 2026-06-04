import SwiftUI

struct ShopScreen: View {
    @EnvironmentObject var gameState: GameState
    @State private var selectedCategory: CosmeticCategory? = nil
    @State private var showGemPurchase = false
    
    private var filteredItems: [CosmeticItem] {
        let items = gameState.shopItems
        guard let category = selectedCategory else { return items }
        return items.filter { $0.category == category }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                GameTheme.backgroundDark.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        gemBalanceCard
                        categoryFilter
                        itemsGrid
                    }
                    .padding()
                }
            }
            .navigationTitle("Shop")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(GameTheme.backgroundDark, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .sheet(isPresented: $showGemPurchase) {
                GemPurchaseSheet()
                    .environmentObject(gameState)
            }
        }
    }
    
    private var gemBalanceCard: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Your Balance")
                    .font(.caption)
                    .foregroundStyle(GameTheme.textMuted)
                HStack(spacing: 6) {
                    Text("💎")
                        .font(.title2)
                    Text("\(gameState.gems)")
                        .font(.title.bold())
                        .foregroundStyle(GameTheme.accentGold)
                }
            }
            
            Spacer()
            
            Button {
                showGemPurchase = true
            } label: {
                Label("Buy Gems", systemImage: "cart.fill")
                    .font(.subheadline.bold())
            }
            .buttonStyle(GlowButtonStyle(color: GameTheme.accentPurple))
        }
        .padding()
        .gameCard()
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(GameTheme.goldGradient, lineWidth: 1)
        )
    }
    
    private var categoryFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                CategoryChip(title: "All", isSelected: selectedCategory == nil) {
                    selectedCategory = nil
                }
                ForEach(CosmeticCategory.allCases, id: \.self) { category in
                    CategoryChip(title: category.rawValue, icon: category.icon, isSelected: selectedCategory == category) {
                        selectedCategory = category
                    }
                }
            }
        }
    }
    
    private var itemsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
            ForEach(filteredItems) { item in
                ShopItemCard(item: item) {
                    _ = gameState.purchaseItem(item)
                }
            }
        }
    }
}

struct CategoryChip: View {
    let title: String
    var icon: String? = nil
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                if let icon {
                    Image(systemName: icon)
                        .font(.caption2)
                }
                Text(title)
                    .font(.caption.bold())
            }
            .foregroundStyle(isSelected ? .black : GameTheme.accentBlue)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(
                Capsule()
                    .fill(isSelected ? GameTheme.accentGold : GameTheme.accentBlue.opacity(0.15))
            )
            .overlay(
                Capsule()
                    .stroke(GameTheme.accentBlue.opacity(isSelected ? 0 : 0.4), lineWidth: 1)
            )
        }
    }
}

struct ShopItemCard: View {
    @EnvironmentObject var gameState: GameState
    let item: CosmeticItem
    let onPurchase: () -> Void
    
    private var isOwned: Bool {
        gameState.cosmetics.contains { $0.id == item.id }
    }
    
    private var canAfford: Bool {
        gameState.gems >= item.gemPrice
    }
    
    var body: some View {
        VStack(spacing: 10) {
            Text(item.emoji)
                .font(.system(size: 40))
                .frame(height: 50)
            
            Text(item.name)
                .font(.caption.bold())
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
                .lineLimit(2)
            
            Text(item.rarity.rawValue)
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(rarityColor)
                .padding(.horizontal, 8)
                .padding(.vertical, 2)
                .background(Capsule().fill(rarityColor.opacity(0.2)))
            
            if isOwned {
                Text("Owned")
                    .font(.caption.bold())
                    .foregroundStyle(GameTheme.accentGreen)
            } else {
                HStack(spacing: 2) {
                    Text("💎")
                        .font(.caption)
                    Text("\(item.gemPrice)")
                        .font(.subheadline.bold())
                        .foregroundStyle(canAfford ? GameTheme.accentGold : .red.opacity(0.8))
                }
                
                Button("Buy") { onPurchase() }
                    .font(.caption.bold())
                    .foregroundStyle(.black)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(canAfford ? GameTheme.accentGold : Color.gray))
                    .disabled(!canAfford)
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .gameCard()
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(rarityColor.opacity(0.3), lineWidth: item.rarity == .epic || item.rarity == .rare ? 1.5 : 0)
        )
    }
    
    private var rarityColor: Color {
        switch item.rarity {
        case .common: return .gray
        case .uncommon: return GameTheme.accentGreen
        case .rare: return GameTheme.accentBlue
        case .epic: return GameTheme.accentPurple
        }
    }
}

struct GemPurchaseSheet: View {
    @EnvironmentObject var gameState: GameState
    @Environment(\.dismiss) private var dismiss
    
    private let packs: [(gems: Int, price: String, bonus: String?)] = [
        (100, "$0.99", nil),
        (550, "$4.99", "+10% bonus"),
        (1200, "$9.99", "+20% bonus"),
        (2500, "$19.99", "Best Value"),
        (6500, "$49.99", "+30% bonus"),
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                GameTheme.backgroundDark.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 14) {
                        Text("Power up your adventure with gems!")
                            .font(.subheadline)
                            .foregroundStyle(GameTheme.textSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.bottom, 8)
                        
                        ForEach(packs, id: \.gems) { pack in
                            Button {
                                gameState.purchaseGemsWithMoney(pack.gems)
                                dismiss()
                            } label: {
                                HStack {
                                    Text("💎")
                                        .font(.title2)
                                    VStack(alignment: .leading) {
                                        Text("\(pack.gems) Gems")
                                            .font(.headline.bold())
                                            .foregroundStyle(.white)
                                        if let bonus = pack.bonus {
                                            Text(bonus)
                                                .font(.caption)
                                                .foregroundStyle(GameTheme.accentGold)
                                        }
                                    }
                                    Spacer()
                                    Text(pack.price)
                                        .font(.headline.bold())
                                        .foregroundStyle(GameTheme.accentGreen)
                                }
                                .padding()
                                .gameCard()
                            }
                        }
                        
                        Text("Prototype: no real charges")
                            .font(.caption2)
                            .foregroundStyle(GameTheme.textMuted)
                            .padding(.top, 8)
                    }
                    .padding()
                }
            }
            .navigationTitle("Buy Gems")
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
    ShopScreen()
        .environmentObject(GameState())
        .preferredColorScheme(.dark)
}
