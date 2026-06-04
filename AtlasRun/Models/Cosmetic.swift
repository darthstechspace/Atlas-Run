import Foundation

enum CosmeticCategory: String, Codable, CaseIterable {
    case outfit = "Outfit"
    case hat = "Hat"
    case shoes = "Shoes"
    case banner = "Banner"
    case trailEffect = "Trail Effect"
    case pet = "Pet"
    
    var icon: String {
        switch self {
        case .outfit: return "tshirt.fill"
        case .hat: return "crown.fill"
        case .shoes: return "shoe.fill"
        case .banner: return "flag.fill"
        case .trailEffect: return "sparkles"
        case .pet: return "pawprint.fill"
        }
    }
}

struct CosmeticItem: Identifiable, Codable, Hashable {
    let id: UUID
    let name: String
    let category: CosmeticCategory
    let emoji: String
    let gemPrice: Int
    let rarity: LandmarkRarity
    var isOwned: Bool
    
    init(
        id: UUID = UUID(),
        name: String,
        category: CosmeticCategory,
        emoji: String,
        gemPrice: Int = 0,
        rarity: LandmarkRarity = .common,
        isOwned: Bool = false
    ) {
        self.id = id
        self.name = name
        self.category = category
        self.emoji = emoji
        self.gemPrice = gemPrice
        self.rarity = rarity
        self.isOwned = isOwned
    }
}

struct EquippedCosmetics: Codable {
    var outfit: UUID?
    var hat: UUID?
    var shoes: UUID?
    var banner: UUID?
    var trailEffect: UUID?
    var pet: UUID?
}
