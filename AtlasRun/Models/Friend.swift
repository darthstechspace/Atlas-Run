import Foundation

struct Friend: Identifiable, Codable {
    let id: UUID
    let name: String
    let level: Int
    let weeklyMiles: Double
    let unlockedAreas: Int
    let avatarEmoji: String
    var isOnline: Bool
    
    init(
        id: UUID = UUID(),
        name: String,
        level: Int,
        weeklyMiles: Double,
        unlockedAreas: Int,
        avatarEmoji: String = "🏃",
        isOnline: Bool = false
    ) {
        self.id = id
        self.name = name
        self.level = level
        self.weeklyMiles = weeklyMiles
        self.unlockedAreas = unlockedAreas
        self.avatarEmoji = avatarEmoji
        self.isOnline = isOnline
    }
}

struct LeaderboardEntry: Identifiable {
    let id: UUID
    let name: String
    let weeklyMiles: Double
    let rank: Int
    let isCurrentUser: Bool
}
