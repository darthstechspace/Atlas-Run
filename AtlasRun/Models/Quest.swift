import Foundation

enum QuestType: String, Codable {
    case daily
    case weekly
}

enum QuestCategory: String, Codable {
    case runMiles = "Run Miles"
    case openChest = "Open Chest"
    case discoverAreas = "Discover Areas"
    case walkSteps = "Walk Steps"
    case addFriend = "Add Friend"
}

struct Quest: Identifiable, Codable {
    let id: UUID
    let title: String
    let description: String
    let type: QuestType
    let category: QuestCategory
    let targetValue: Int
    var currentValue: Int
    let gemReward: Int
    var itemReward: String?
    var isClaimed: Bool
    
    var progress: Double {
        guard targetValue > 0 else { return 0 }
        return min(Double(currentValue) / Double(targetValue), 1.0)
    }
    
    var isComplete: Bool {
        currentValue >= targetValue
    }
    
    init(
        id: UUID = UUID(),
        title: String,
        description: String,
        type: QuestType,
        category: QuestCategory,
        targetValue: Int,
        currentValue: Int = 0,
        gemReward: Int,
        itemReward: String? = nil,
        isClaimed: Bool = false
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.type = type
        self.category = category
        self.targetValue = targetValue
        self.currentValue = currentValue
        self.gemReward = gemReward
        self.itemReward = itemReward
        self.isClaimed = isClaimed
    }
}
