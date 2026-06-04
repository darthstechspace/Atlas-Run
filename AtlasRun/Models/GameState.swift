import Foundation
import CoreLocation
import Combine

@MainActor
final class GameState: ObservableObject {
    // MARK: - Player Stats
    @Published var username: String = "Explorer"
    @Published var level: Int = 1
    @Published var xp: Int = 0
    @Published var gems: Int = 150
    @Published var totalMiles: Double = 0
    @Published var streakDays: Int = 3
    @Published var safeModeEnabled: Bool = false {
        didSet { UserDefaults.standard.set(safeModeEnabled, forKey: Self.safeModeKey) }
    }
    @Published var playSafetyAlertsEnabled: Bool = true {
        didSet { UserDefaults.standard.set(playSafetyAlertsEnabled, forKey: Self.playSafetyAlertsKey) }
    }

    private static let safeModeKey = "atlasrun.safeModeEnabled"
    private static let playSafetyAlertsKey = "atlasrun.playSafetyAlertsEnabled"
    
    // MARK: - Progress
    @Published var unlockedAreas: [UnlockedArea] = []
    @Published var landmarks: [Landmark] = []
    @Published var openedChests: Int = 0
    @Published var cosmetics: [CosmeticItem] = []
    @Published var equipped: EquippedCosmetics = EquippedCosmetics()
    @Published var quests: [Quest] = []
    @Published var friends: [Friend] = []
    @Published var badges: [Badge] = []
    @Published var ghostRuns: [GhostRun] = []
    @Published var totalSteps: Int = 0
    
    // MARK: - Run State
    @Published var isRunning: Bool = false
    @Published var runDistanceMiles: Double = 0
    @Published var runStartTime: Date?
    @Published var isGhostRunActive: Bool = false
    @Published var ghostRunTarget: GhostRun?
    
    // MARK: - UI State
    @Published var lastReward: ChestReward?
    @Published var showRewardPopup: Bool = false
    @Published var toastMessage: String?
    
    // Default location: Worcester for demo
    @Published var userLocation: CLLocationCoordinate2D = CLLocationCoordinate2D(latitude: 42.2626, longitude: -71.8023)
    
    var xpProgress: Double {
        Double(xp) / Double(xpRequiredForNextLevel)
    }
    
    var xpRequiredForNextLevel: Int {
        100 + (level - 1) * 75
    }
    
    var weeklyLeaderboard: [LeaderboardEntry] {
        var entries = friends.map { friend in
            LeaderboardEntry(id: friend.id, name: friend.name, weeklyMiles: friend.weeklyMiles, rank: 0, isCurrentUser: false)
        }
        entries.append(LeaderboardEntry(
            id: UUID(),
            name: username,
            weeklyMiles: min(totalMiles, 12.5),
            rank: 0,
            isCurrentUser: true
        ))
        entries.sort { $0.weeklyMiles > $1.weeklyMiles }
        return entries.enumerated().map { index, entry in
            LeaderboardEntry(id: entry.id, name: entry.name, weeklyMiles: entry.weeklyMiles, rank: index + 1, isCurrentUser: entry.isCurrentUser)
        }
    }
    
    init() {
        safeModeEnabled = UserDefaults.standard.object(forKey: Self.safeModeKey) as? Bool ?? false
        if UserDefaults.standard.object(forKey: Self.playSafetyAlertsKey) != nil {
            playSafetyAlertsEnabled = UserDefaults.standard.bool(forKey: Self.playSafetyAlertsKey)
        }
        setupSampleData()
    }
    
    // MARK: - XP & Leveling
    
    func addXP(_ amount: Int) {
        xp += amount
        while xp >= xpRequiredForNextLevel {
            xp -= xpRequiredForNextLevel
            level += 1
            showToast("Level Up! You're now Level \(level)! 🎉")
            checkBadges()
        }
    }
    
    func addGems(_ amount: Int) {
        gems += amount
    }
    
    // MARK: - Landmarks & Chests
    
    func distanceToLandmark(_ landmark: Landmark) -> Double {
        let userLoc = CLLocation(latitude: userLocation.latitude, longitude: userLocation.longitude)
        let landmarkLoc = CLLocation(latitude: landmark.latitude, longitude: landmark.longitude)
        return userLoc.distance(from: landmarkLoc)
    }
    
    func canInteractWithLandmark(_ landmark: Landmark) -> Bool {
        distanceToLandmark(landmark) <= 100 && !landmark.isOnCooldown
    }
    
    func openChest(at landmarkIndex: Int) {
        guard landmarkIndex < landmarks.count else { return }
        let landmark = landmarks[landmarkIndex]
        guard canInteractWithLandmark(landmark) else {
            if landmark.isOnCooldown {
                showToast("Chest on cooldown. Come back tomorrow!")
            } else {
                showToast("Get closer to open this chest!")
            }
            return
        }
        
        let reward = generateChestReward(for: landmarks[landmarkIndex].rarity)
        applyReward(reward)
        
        landmarks[landmarkIndex].lastOpenedAt = Date()
        openedChests += 1
        
        updateQuestProgress(category: .openChest, amount: 1)
        unlockArea(around: landmarks[landmarkIndex].coordinate, radius: 200)
        checkBadges()
        
        lastReward = reward
        showRewardPopup = true
    }
    
    func generateChestReward(for rarity: LandmarkRarity) -> ChestReward {
        let xpAmount = Int.random(in: rarity.xpRange)
        let gemAmount = Int.random(in: rarity.gemRange)
        let isRare = rarity == .rare || rarity == .epic || Double.random(in: 0...1) < 0.1
        
        var cosmetic: CosmeticItem? = nil
        if Double.random(in: 0...1) < rarity.cosmeticChance {
            let unowned = shopItems.filter { shop in
                !cosmetics.contains(where: { $0.id == shop.id })
            }
            if let item = unowned.randomElement() {
                cosmetic = item
            }
        }
        
        return ChestReward(xp: xpAmount, gems: gemAmount, cosmetic: cosmetic, isRare: isRare)
    }
    
    func applyReward(_ reward: ChestReward) {
        addXP(reward.xp)
        addGems(reward.gems)
        if let cosmetic = reward.cosmetic {
            var owned = cosmetic
            owned.isOwned = true
            if !cosmetics.contains(where: { $0.id == cosmetic.id }) {
                cosmetics.append(owned)
            }
        }
    }
    
    // MARK: - Fog of War
    
    func isAreaUnlocked(at coordinate: CLLocationCoordinate2D) -> Bool {
        let point = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
        return unlockedAreas.contains { area in
            let center = CLLocation(latitude: area.centerLatitude, longitude: area.centerLongitude)
            return point.distance(from: center) <= area.radiusMeters
        }
    }
    
    func unlockArea(around coordinate: CLLocationCoordinate2D, radius: Double = 150) {
        let alreadyUnlocked = unlockedAreas.contains { area in
            let center = CLLocation(latitude: area.centerLatitude, longitude: area.centerLongitude)
            let newCenter = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
            return center.distance(from: newCenter) < radius * 0.5
        }
        guard !alreadyUnlocked else { return }
        
        let area = UnlockedArea(
            id: UUID(),
            centerLatitude: coordinate.latitude,
            centerLongitude: coordinate.longitude,
            radiusMeters: radius,
            unlockedAt: Date()
        )
        unlockedAreas.append(area)
        updateQuestProgress(category: .discoverAreas, amount: 1)
    }
    
    // MARK: - Running
    
    func startRun() {
        isRunning = true
        runDistanceMiles = 0
        runStartTime = Date()
        isGhostRunActive = false
        ghostRunTarget = nil
    }
    
    func startGhostRun(_ ghostRun: GhostRun) {
        isRunning = true
        runDistanceMiles = 0
        runStartTime = Date()
        isGhostRunActive = true
        ghostRunTarget = ghostRun
    }
    
    func simulateRunTick() {
        guard isRunning else { return }
        let increment = 0.05 // ~0.05 miles per tick
        runDistanceMiles += increment
        totalMiles += increment
        totalSteps += 80
        
        // Unlock fog along run path
        unlockArea(around: userLocation, radius: 120)
        
        // Simulate movement
        userLocation = CLLocationCoordinate2D(
            latitude: userLocation.latitude + Double.random(in: -0.0003...0.0003),
            longitude: userLocation.longitude + Double.random(in: -0.0003...0.0003)
        )
        
        updateQuestProgress(category: .runMiles, amount: 0) // Updated on end
        
        // Ghost run comparison
        if isGhostRunActive, let target = ghostRunTarget {
            if runDistanceMiles >= target.distanceMiles {
                endRun(beatGhost: true)
            }
        }
    }
    
    func endRun(beatGhost: Bool = false) {
        guard isRunning else { return }
        isRunning = false
        
        let xpEarned = Int(runDistanceMiles * 50) + (beatGhost ? 100 : 0)
        addXP(xpEarned)
        
        let run = GhostRun(
            id: UUID(),
            date: Date(),
            distanceMiles: runDistanceMiles,
            durationMinutes: runStartTime.map { Date().timeIntervalSince($0) / 60 } ?? 0,
            xpEarned: xpEarned,
            routeName: "Run #\(ghostRuns.count + 1)"
        )
        ghostRuns.insert(run, at: 0)
        
        updateQuestProgress(category: .runMiles, amount: Int(runDistanceMiles))
        updateQuestProgress(category: .walkSteps, amount: Int(runDistanceMiles * 1600))
        
        streakDays += 1
        checkBadges()
        
        if beatGhost {
            showToast("Ghost Run beaten! +100 bonus XP! 👻")
        } else {
            showToast("Run complete! +\(xpEarned) XP")
        }
        
        runDistanceMiles = 0
        runStartTime = nil
        isGhostRunActive = false
        ghostRunTarget = nil
    }
    
    // MARK: - Quests
    
    func updateQuestProgress(category: QuestCategory, amount: Int) {
        for i in quests.indices {
            if quests[i].category == category && !quests[i].isClaimed {
                if category == .runMiles || category == .walkSteps || category == .discoverAreas || category == .openChest {
                    quests[i].currentValue = min(quests[i].currentValue + max(amount, 1), quests[i].targetValue)
                } else if amount > 0 {
                    quests[i].currentValue = min(quests[i].currentValue + amount, quests[i].targetValue)
                }
            }
        }
    }
    
    func claimQuest(_ quest: Quest) {
        guard let index = quests.firstIndex(where: { $0.id == quest.id }),
              quests[index].isComplete,
              !quests[index].isClaimed else { return }
        
        quests[index].isClaimed = true
        addGems(quests[index].gemReward)
        
        if let itemName = quests[index].itemReward {
            showToast("Claimed! +\(quests[index].gemReward) gems & \(itemName)!")
        } else {
            showToast("Claimed! +\(quests[index].gemReward) gems!")
        }
    }
    
    // MARK: - Shop
    
    var shopItems: [CosmeticItem] {
        SampleData.shopItems
    }
    
    func purchaseGemsWithMoney(_ amount: Int) {
        gems += amount
        showToast("Purchased \(amount) gems! 💎")
    }
    
    func teleportToLandmark(_ landmark: Landmark) {
        userLocation = landmark.coordinate
        unlockArea(around: landmark.coordinate, radius: 150)
        showToast("Teleported near \(landmark.name) (demo)")
    }
    
    func purchaseItem(_ item: CosmeticItem) -> Bool {
        guard gems >= item.gemPrice else {
            showToast("Not enough gems!")
            return false
        }
        guard !cosmetics.contains(where: { $0.id == item.id }) else {
            showToast("You already own this!")
            return false
        }
        
        gems -= item.gemPrice
        var owned = item
        owned.isOwned = true
        cosmetics.append(owned)
        showToast("Purchased \(item.name)! 🎉")
        return true
    }
    
    func equipCosmetic(_ item: CosmeticItem) {
        switch item.category {
        case .outfit: equipped.outfit = item.id
        case .hat: equipped.hat = item.id
        case .shoes: equipped.shoes = item.id
        case .banner: equipped.banner = item.id
        case .trailEffect: equipped.trailEffect = item.id
        case .pet: equipped.pet = item.id
        }
    }
    
    func isEquipped(_ item: CosmeticItem) -> Bool {
        switch item.category {
        case .outfit: return equipped.outfit == item.id
        case .hat: return equipped.hat == item.id
        case .shoes: return equipped.shoes == item.id
        case .banner: return equipped.banner == item.id
        case .trailEffect: return equipped.trailEffect == item.id
        case .pet: return equipped.pet == item.id
        }
    }
    
    func ownedAndShopItems() -> [CosmeticItem] {
        var all = cosmetics
        for shop in shopItems where !all.contains(where: { $0.id == shop.id }) {
            all.append(shop)
        }
        return all
    }
    
    // MARK: - Friends
    
    func addFriend() {
        let names = ["Alex", "Jordan", "Casey", "Riley", "Morgan", "Taylor", "Quinn", "Avery"]
        let name = names.randomElement() ?? "Runner"
        guard !friends.contains(where: { $0.name == name }) else {
            showToast("Friend request sent!")
            return
        }
        let friend = Friend(
            name: name,
            level: Int.random(in: 3...25),
            weeklyMiles: Double.random(in: 2...20),
            unlockedAreas: Int.random(in: 5...50),
            avatarEmoji: ["🏃", "🚴", "🧗", "⛹️", "🤸"].randomElement() ?? "🏃",
            isOnline: Bool.random()
        )
        friends.append(friend)
        updateQuestProgress(category: .addFriend, amount: 1)
        showToast("\(name) added as friend!")
    }
    
    // MARK: - Badges
    
    func checkBadges() {
        for i in badges.indices {
            switch badges[i].name {
            case "First Steps":
                if totalMiles >= 0.1 { badges[i].isUnlocked = true }
            case "Explorer":
                if unlockedAreas.count >= 5 { badges[i].isUnlocked = true }
            case "Treasure Hunter":
                if openedChests >= 5 { badges[i].isUnlocked = true }
            case "Marathon Spirit":
                if totalMiles >= 10 { badges[i].isUnlocked = true }
            case "Level 10":
                if level >= 10 { badges[i].isUnlocked = true }
            case "Streak Master":
                if streakDays >= 7 { badges[i].isUnlocked = true }
            case "Ghost Buster":
                if ghostRuns.count >= 3 { badges[i].isUnlocked = true }
            default:
                break
            }
        }
    }
    
    func showToast(_ message: String) {
        toastMessage = message
        Task {
            try? await Task.sleep(nanoseconds: 2_500_000_000)
            if toastMessage == message {
                toastMessage = nil
            }
        }
    }
    
    // MARK: - Sample Data
    
    private func setupSampleData() {
        landmarks = SampleData.landmarks(near: userLocation)
        quests = SampleData.quests
        friends = SampleData.friends
        badges = SampleData.badges
        ghostRuns = SampleData.ghostRuns
        cosmetics = SampleData.starterCosmetics
        if let starter = cosmetics.first {
            equipped.outfit = starter.id
        }
        
        // Unlock starting area
        unlockArea(around: userLocation, radius: 200)
    }
}

enum SampleData {
    static func landmarks(near center: CLLocationCoordinate2D) -> [Landmark] {
        [
            Landmark(name: "Worcester Art Museum", latitude: 42.2755, longitude: -71.8023, rarity: .epic),
            Landmark(name: "Elm Park", latitude: 42.2675, longitude: -71.8145, rarity: .uncommon),
            Landmark(name: "Mechanics Hall", latitude: 42.2625, longitude: -71.8038, rarity: .rare),
            Landmark(name: "Worcester Common", latitude: 42.261, longitude: -71.801, rarity: .uncommon),
            Landmark(name: "Union Station", latitude: 42.2615, longitude: -71.795, rarity: .uncommon),
            Landmark(name: "EcoTarium", latitude: 42.3114, longitude: -71.7967, rarity: .rare),
            Landmark(name: "Institute Park", latitude: 42.2735, longitude: -71.8095, rarity: .common),
            Landmark(name: "Bancroft Tower", latitude: 42.2915, longitude: -71.8185, rarity: .epic),
        ]
    }
    
    static let quests: [Quest] = [
        Quest(title: "Morning Mile", description: "Run 1 mile today", type: .daily, category: .runMiles, targetValue: 1, gemReward: 10),
        Quest(title: "Chest Hunter", description: "Open 1 treasure chest", type: .daily, category: .openChest, targetValue: 1, gemReward: 15),
        Quest(title: "Area Scout", description: "Discover 3 new areas", type: .daily, category: .discoverAreas, targetValue: 3, currentValue: 1, gemReward: 20),
        Quest(title: "Step Counter", description: "Walk 10,000 steps", type: .weekly, category: .walkSteps, targetValue: 10000, currentValue: 3200, gemReward: 50, itemReward: "Mystery Trail Effect"),
        Quest(title: "Social Runner", description: "Add a friend", type: .weekly, category: .addFriend, targetValue: 1, gemReward: 25),
        Quest(title: "Weekly Warrior", description: "Run 5 miles this week", type: .weekly, category: .runMiles, targetValue: 5, currentValue: 2, gemReward: 75),
    ]
    
    static let friends: [Friend] = [
        Friend(name: "Sarah Chen", level: 18, weeklyMiles: 15.2, unlockedAreas: 42, avatarEmoji: "🏃‍♀️", isOnline: true),
        Friend(name: "Mike Torres", level: 12, weeklyMiles: 8.7, unlockedAreas: 28, avatarEmoji: "🚴", isOnline: false),
        Friend(name: "Emma Wilson", level: 24, weeklyMiles: 22.1, unlockedAreas: 67, avatarEmoji: "🧗‍♀️", isOnline: true),
        Friend(name: "James Park", level: 9, weeklyMiles: 5.3, unlockedAreas: 19, avatarEmoji: "⛹️", isOnline: false),
        Friend(name: "Luna Martinez", level: 15, weeklyMiles: 11.8, unlockedAreas: 35, avatarEmoji: "🤸", isOnline: true),
    ]
    
    static let badges: [Badge] = [
        Badge(name: "First Steps", description: "Complete your first run", emoji: "👟", requirement: "Run any distance"),
        Badge(name: "Explorer", description: "Unlock 5 areas", emoji: "🗺️", requirement: "Discover 5 fog areas"),
        Badge(name: "Treasure Hunter", description: "Open 5 chests", emoji: "📦", requirement: "Open 5 treasure chests"),
        Badge(name: "Marathon Spirit", description: "Run 10 total miles", emoji: "🏅", isUnlocked: false, requirement: "10 total miles"),
        Badge(name: "Level 10", description: "Reach level 10", emoji: "⭐", requirement: "Level 10"),
        Badge(name: "Streak Master", description: "7-day streak", emoji: "🔥", requirement: "7 day streak"),
        Badge(name: "Ghost Buster", description: "Complete 3 ghost runs", emoji: "👻", requirement: "3 ghost runs"),
    ]
    
    static let ghostRuns: [GhostRun] = [
        GhostRun(id: UUID(), date: Date().addingTimeInterval(-86400), distanceMiles: 2.3, durationMinutes: 22, xpEarned: 115, routeName: "Sunset Loop"),
        GhostRun(id: UUID(), date: Date().addingTimeInterval(-172800), distanceMiles: 1.8, durationMinutes: 18, xpEarned: 90, routeName: "Harbor Run"),
        GhostRun(id: UUID(), date: Date().addingTimeInterval(-259200), distanceMiles: 3.1, durationMinutes: 28, xpEarned: 155, routeName: "Hill Climb"),
    ]
    
    static let starterCosmetics: [CosmeticItem] = [
        CosmeticItem(name: "Starter Runner", category: .outfit, emoji: "👕", isOwned: true),
    ]
    
    static let shopItems: [CosmeticItem] = [
        CosmeticItem(name: "Neon Runner Suit", category: .outfit, emoji: "🦺", gemPrice: 200, rarity: .rare),
        CosmeticItem(name: "Shadow Cloak", category: .outfit, emoji: "🥷", gemPrice: 350, rarity: .epic),
        CosmeticItem(name: "Explorer Cap", category: .hat, emoji: "🧢", gemPrice: 75, rarity: .common),
        CosmeticItem(name: "Golden Crown", category: .hat, emoji: "👑", gemPrice: 500, rarity: .epic),
        CosmeticItem(name: "Wizard Hat", category: .hat, emoji: "🎩", gemPrice: 150, rarity: .uncommon),
        CosmeticItem(name: "Speed Sneakers", category: .shoes, emoji: "👟", gemPrice: 100, rarity: .common),
        CosmeticItem(name: "Rocket Boots", category: .shoes, emoji: "🚀", gemPrice: 300, rarity: .rare),
        CosmeticItem(name: "Mountain Banner", category: .banner, emoji: "🏔️", gemPrice: 80, rarity: .common),
        CosmeticItem(name: "Galaxy Banner", category: .banner, emoji: "🌌", gemPrice: 250, rarity: .rare),
        CosmeticItem(name: "Spark Trail", category: .trailEffect, emoji: "✨", gemPrice: 180, rarity: .uncommon),
        CosmeticItem(name: "Fire Trail", category: .trailEffect, emoji: "🔥", gemPrice: 400, rarity: .epic),
        CosmeticItem(name: "Pixel Pup", category: .pet, emoji: "🐕", gemPrice: 220, rarity: .uncommon),
        CosmeticItem(name: "Dragon Companion", category: .pet, emoji: "🐉", gemPrice: 600, rarity: .epic),
    ]
}
