import Foundation
import CoreLocation

enum LandmarkRarity: String, Codable, CaseIterable {
    case common = "Common"
    case uncommon = "Uncommon"
    case rare = "Rare"
    case epic = "Epic"
    
    var color: String {
        switch self {
        case .common: return "gray"
        case .uncommon: return "green"
        case .rare: return "blue"
        case .epic: return "purple"
        }
    }
    
    var xpRange: ClosedRange<Int> {
        switch self {
        case .common: return 25...50
        case .uncommon: return 50...100
        case .rare: return 100...200
        case .epic: return 200...500
        }
    }
    
    var gemRange: ClosedRange<Int> {
        switch self {
        case .common: return 1...3
        case .uncommon: return 3...8
        case .rare: return 8...20
        case .epic: return 20...50
        }
    }
    
    var cosmeticChance: Double {
        switch self {
        case .common: return 0.05
        case .uncommon: return 0.15
        case .rare: return 0.35
        case .epic: return 0.60
        }
    }
}

struct Landmark: Identifiable, Codable {
    let id: UUID
    let name: String
    let latitude: Double
    let longitude: Double
    let rarity: LandmarkRarity
    var lastOpenedAt: Date?
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
    
    var isOnCooldown: Bool {
        guard let lastOpened = lastOpenedAt else { return false }
        return Date().timeIntervalSince(lastOpened) < 86400 // 24 hours
    }
    
    var cooldownRemaining: TimeInterval {
        guard let lastOpened = lastOpenedAt else { return 0 }
        let elapsed = Date().timeIntervalSince(lastOpened)
        return max(0, 86400 - elapsed)
    }
    
    init(id: UUID = UUID(), name: String, latitude: Double, longitude: Double, rarity: LandmarkRarity, lastOpenedAt: Date? = nil) {
        self.id = id
        self.name = name
        self.latitude = latitude
        self.longitude = longitude
        self.rarity = rarity
        self.lastOpenedAt = lastOpenedAt
    }
}

struct UnlockedArea: Identifiable, Codable {
    let id: UUID
    let centerLatitude: Double
    let centerLongitude: Double
    let radiusMeters: Double
    let unlockedAt: Date
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: centerLatitude, longitude: centerLongitude)
    }
}

struct ChestReward {
    let xp: Int
    let gems: Int
    let cosmetic: CosmeticItem?
    let isRare: Bool
}

struct GhostRun: Identifiable, Codable {
    let id: UUID
    let date: Date
    let distanceMiles: Double
    let durationMinutes: Double
    let xpEarned: Int
    let routeName: String
}
