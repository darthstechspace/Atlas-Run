import Foundation

struct Badge: Identifiable, Codable {
    let id: UUID
    let name: String
    let description: String
    let emoji: String
    var isUnlocked: Bool
    let requirement: String
    
    init(
        id: UUID = UUID(),
        name: String,
        description: String,
        emoji: String,
        isUnlocked: Bool = false,
        requirement: String
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.emoji = emoji
        self.isUnlocked = isUnlocked
        self.requirement = requirement
    }
}
