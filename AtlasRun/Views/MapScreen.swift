import SwiftUI
import MapKit

struct MapScreen: View {
    @EnvironmentObject var gameState: GameState
    @StateObject private var locationManager = LocationManager()
    @State private var selectedLandmark: Landmark?
    @State private var showChestPopup = false
    @State private var showGhostRunPicker = false
    @State private var cameraPosition: MapCameraPosition = .automatic
    @State private var runTimer: Timer?
    @State private var playSafetyMonitor = PlaySafetyMonitor()
    @State private var playSafetyLevel: PlaySafetyLevel = .ok
    
    private var safetyMessage: String? {
        guard gameState.playSafetyAlertsEnabled else { return nil }
        return PlaySafetyMonitor.message(for: playSafetyLevel)
    }
    
    var body: some View {
        ZStack {
            Map(position: $cameraPosition) {
                UserAnnotation()
                
                ForEach(Array(gameState.landmarks.enumerated()), id: \.element.id) { index, landmark in
                    Annotation(landmark.name, coordinate: landmark.coordinate) {
                        LandmarkMarker(landmark: landmark, isNearby: gameState.distanceToLandmark(landmark) <= 100)
                            .onTapGesture {
                                selectedLandmark = landmark
                                showChestPopup = true
                            }
                    }
                }
                
                ForEach(gameState.unlockedAreas) { area in
                    MapCircle(center: area.coordinate, radius: area.radiusMeters)
                        .foregroundStyle(GameTheme.accentBlue.opacity(0.08))
                        .stroke(GameTheme.accentBlue.opacity(0.2), lineWidth: 1)
                }
            }
            .mapStyle(.standard(elevation: .realistic, pointsOfInterest: .excludingAll))
            .mapControls {
                MapUserLocationButton()
                MapCompass()
            }
            .ignoresSafeArea(edges: .top)
            
            // Fog of War Overlay
            FogOfWarOverlay(unlockedAreas: gameState.unlockedAreas, userLocation: gameState.userLocation)
                .allowsHitTesting(false)
            
            // HUD
            VStack {
                if let message = safetyMessage {
                    HStack(spacing: 8) {
                        Image(systemName: playSafetyLevel == .drive ? "car.fill" : "exclamationmark.triangle.fill")
                            .foregroundStyle(playSafetyLevel == .drive ? .red : GameTheme.accentPurple)
                        Text(message)
                            .font(.caption.bold())
                            .foregroundStyle(.white)
                            .multilineTextAlignment(.leading)
                    }
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(playSafetyLevel == .drive ? Color.red.opacity(0.25) : GameTheme.accentPurple.opacity(0.2))
                            .stroke(playSafetyLevel == .drive ? Color.red.opacity(0.5) : GameTheme.accentPurple.opacity(0.5), lineWidth: 1)
                    )
                }
                topHUD
                Spacer()
                bottomControls
            }
            .padding()
            
            // Chest Popup
            if showChestPopup, let landmark = selectedLandmark,
               let index = gameState.landmarks.firstIndex(where: { $0.id == landmark.id }) {
                ChestPopupView(
                    landmark: gameState.landmarks[index],
                    distance: gameState.distanceToLandmark(landmark),
                    onOpen: {
                        gameState.openChest(at: index)
                    },
                    onDismiss: {
                        showChestPopup = false
                        selectedLandmark = nil
                    },
                    onTeleport: {
                        gameState.teleportToLandmark(landmark)
                    }
                )
            }
            
            // Reward Popup
            if gameState.showRewardPopup, let reward = gameState.lastReward {
                RewardPopupView(reward: reward) {
                    gameState.showRewardPopup = false
                    showChestPopup = false
                    selectedLandmark = nil
                }
            }
            
            // Run Overlay
            if gameState.isRunning {
                RunOverlayView()
            }
            
            // Ghost Run Picker
            if showGhostRunPicker {
                GhostRunPickerView(onSelect: { run in
                    guard tryStartRun() else { return }
                    gameState.startGhostRun(run)
                    startRunTimer()
                    showGhostRunPicker = false
                }, onDismiss: {
                    showGhostRunPicker = false
                })
            }
            
            // Toast
            if let toast = gameState.toastMessage {
                VStack {
                    Spacer()
                    Text(toast)
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .background(Capsule().fill(Color.black.opacity(0.8)))
                        .padding(.bottom, 120)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .animation(.spring(), value: gameState.toastMessage)
            }
        }
        .onAppear {
            locationManager.requestPermission()
            locationManager.startUpdating()
            cameraPosition = .region(MKCoordinateRegion(
                center: gameState.userLocation,
                latitudinalMeters: 2000,
                longitudinalMeters: 2000
            ))
        }
        .onChange(of: locationManager.location) { _, newLocation in
            if let coord = newLocation {
                gameState.userLocation = coord
                gameState.unlockArea(around: coord, radius: 100)
            }
        }
        .onChange(of: locationManager.speedMps) { _, speed in
            if gameState.playSafetyAlertsEnabled {
                playSafetyLevel = playSafetyMonitor.evaluate(speedMps: speed)
            } else {
                playSafetyLevel = .ok
            }
        }
        .onChange(of: gameState.playSafetyAlertsEnabled) { _, enabled in
            if !enabled {
                playSafetyLevel = .ok
            }
        }
    }
    
    private func tryStartRun() -> Bool {
        if playSafetyLevel == .drive {
            gameState.showToast("Don't play while driving. Stop safely first.")
            return false
        }
        return true
    }
    
    private func startRunIfSafe() {
        guard tryStartRun() else { return }
        gameState.startRun()
        startRunTimer()
    }
    
    private var topHUD: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Image(systemName: "flame.fill")
                        .foregroundStyle(.orange)
                    Text("\(gameState.streakDays)")
                        .font(.caption.bold())
                        .foregroundStyle(.white)
                }
                Text("Streak")
                    .font(.caption2)
                    .foregroundStyle(GameTheme.textMuted)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .gameCard()
            
            Spacer()
            
            HStack(spacing: 4) {
                Text("💎")
                Text("\(gameState.gems)")
                    .font(.headline.bold())
                    .foregroundStyle(GameTheme.accentGold)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .gameCard()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text("Lv.\(gameState.level)")
                    .font(.caption.bold())
                    .foregroundStyle(GameTheme.accentGold)
                XPProgressBar(progress: gameState.xpProgress, level: gameState.level)
                    .frame(width: 80)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .gameCard()
        }
    }
    
    private var bottomControls: some View {
        VStack(spacing: 12) {
            if gameState.isRunning {
                HStack {
                    VStack(alignment: .leading) {
                        Text(String(format: "%.2f mi", gameState.runDistanceMiles))
                            .font(.title2.bold())
                            .foregroundStyle(.white)
                        if gameState.isGhostRunActive, let ghost = gameState.ghostRunTarget {
                            Text("vs \(ghost.routeName): \(String(format: "%.1f", ghost.distanceMiles)) mi")
                                .font(.caption)
                                .foregroundStyle(GameTheme.accentPurple)
                        }
                        if playSafetyLevel != .ok && gameState.playSafetyAlertsEnabled {
                            Text("High speed: distance may not count")
                                .font(.caption2)
                                .foregroundStyle(.orange)
                        }
                    }
                    Spacer()
                    Button("End Run") {
                        stopRunTimer()
                        gameState.endRun()
                    }
                    .buttonStyle(GlowButtonStyle(color: .red.opacity(0.8)))
                }
                .padding()
                .gameCard()
            } else {
                HStack(spacing: 12) {
                    Button {
                        showGhostRunPicker = true
                    } label: {
                        Label("Ghost Run", systemImage: "figure.run")
                            .font(.subheadline.bold())
                    }
                    .buttonStyle(SecondaryButtonStyle())
                    
                    Button("Start Run") {
                        startRunIfSafe()
                    }
                    .buttonStyle(GlowButtonStyle())
                }
            }
        }
    }
    
    private func startRunTimer() {
        runTimer?.invalidate()
        runTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            Task { @MainActor in
                gameState.simulateRunTick()
            }
        }
    }
    
    private func stopRunTimer() {
        runTimer?.invalidate()
        runTimer = nil
    }
}

struct LandmarkMarker: View {
    let landmark: Landmark
    let isNearby: Bool
    
    var rarityColor: Color {
        switch landmark.rarity {
        case .common: return .gray
        case .uncommon: return GameTheme.accentGreen
        case .rare: return GameTheme.accentBlue
        case .epic: return GameTheme.accentPurple
        }
    }
    
    var body: some View {
        ZStack {
            Circle()
                .fill(rarityColor.opacity(0.3))
                .frame(width: isNearby ? 50 : 40, height: isNearby ? 50 : 40)
                .shadow(color: rarityColor.opacity(isNearby ? 0.8 : 0.4), radius: isNearby ? 12 : 6)
            
            Text("📦")
                .font(.title3)
            
            if landmark.isOnCooldown {
                Image(systemName: "clock.fill")
                    .font(.caption2)
                    .foregroundStyle(.white)
                    .offset(x: 14, y: -14)
            }
        }
        .scaleEffect(isNearby ? 1.1 : 1.0)
        .animation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true), value: isNearby)
    }
}

struct FogOfWarOverlay: View {
    let unlockedAreas: [UnlockedArea]
    let userLocation: CLLocationCoordinate2D
    
    var body: some View {
        Canvas { context, size in
            // Fill entire screen with fog
            context.fill(
                Path(CGRect(origin: .zero, size: size)),
                with: .color(.black.opacity(0.65))
            )
            
            // Cut out unlocked areas
            for area in unlockedAreas {
                let normalizedX = 0.5 + (area.centerLongitude - userLocation.longitude) * 8000
                let normalizedY = 0.5 - (area.centerLatitude - userLocation.latitude) * 8000
                let radius = area.radiusMeters / 8
                
                let rect = CGRect(
                    x: normalizedX * size.width - radius,
                    y: normalizedY * size.height - radius,
                    width: radius * 2,
                    height: radius * 2
                )
                
                context.blendMode = .destinationOut
                context.fill(Path(ellipseIn: rect), with: .color(.white))
                context.blendMode = .normal
            }
            
            // Always clear around user
            let userRect = CGRect(
                x: size.width / 2 - 80,
                y: size.height / 2 - 80,
                width: 160,
                height: 160
            )
            context.blendMode = .destinationOut
            context.fill(Path(ellipseIn: userRect), with: .color(.white))
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
    }
}

struct ChestPopupView: View {
    let landmark: Landmark
    let distance: Double
    let onOpen: () -> Void
    let onDismiss: () -> Void
    var onTeleport: (() -> Void)? = nil
    
    var canOpen: Bool {
        distance <= 100 && !landmark.isOnCooldown
    }
    
    var body: some View {
        ZStack {
            Color.black.opacity(0.6)
                .ignoresSafeArea()
                .onTapGesture { onDismiss() }
            
            VStack(spacing: 20) {
                Text("📦")
                    .font(.system(size: 60))
                
                Text(landmark.name)
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                
                HStack {
                    Text(landmark.rarity.rawValue)
                        .font(.caption.bold())
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(rarityColor.opacity(0.3)))
                        .foregroundStyle(rarityColor)
                }
                
                if landmark.isOnCooldown {
                    let remaining = landmark.cooldownRemaining
                    let hours = Int(remaining) / 3600
                    let minutes = (Int(remaining) % 3600) / 60
                    Text("Cooldown: \(hours)h \(minutes)m")
                        .font(.subheadline)
                        .foregroundStyle(GameTheme.textSecondary)
                } else if distance > 100 {
                    Text(String(format: "%.0fm away. Get closer!", distance))
                        .font(.subheadline)
                        .foregroundStyle(.orange)
                } else {
                    Text("You're close enough to open!")
                        .font(.subheadline)
                        .foregroundStyle(GameTheme.accentGreen)
                }
                
                HStack(spacing: 16) {
                    Button("Close") { onDismiss() }
                        .buttonStyle(SecondaryButtonStyle())
                    
                    if !canOpen && distance > 100 {
                        Button("Go There") {
                            onTeleport?()
                        }
                        .buttonStyle(SecondaryButtonStyle())
                    }
                    
                    Button("Open Chest") { onOpen() }
                        .buttonStyle(GlowButtonStyle())
                        .disabled(!canOpen)
                        .opacity(canOpen ? 1 : 0.5)
                }
            }
            .padding(28)
            .gameCard()
            .padding(.horizontal, 32)
        }
    }
    
    var rarityColor: Color {
        switch landmark.rarity {
        case .common: return .gray
        case .uncommon: return GameTheme.accentGreen
        case .rare: return GameTheme.accentBlue
        case .epic: return GameTheme.accentPurple
        }
    }
}

struct RewardPopupView: View {
    let reward: ChestReward
    let onDismiss: () -> Void
    
    var body: some View {
        ZStack {
            Color.black.opacity(0.7)
                .ignoresSafeArea()
            
            VStack(spacing: 16) {
                Text(reward.isRare ? "✨ RARE REWARD! ✨" : "🎉 REWARD!")
                    .font(.headline.bold())
                    .foregroundStyle(reward.isRare ? GameTheme.accentGold : .white)
                
                VStack(spacing: 12) {
                    HStack {
                        Text("⚡ +\(reward.xp) XP")
                            .font(.title3.bold())
                            .foregroundStyle(GameTheme.accentBlue)
                    }
                    HStack {
                        Text("💎 +\(reward.gems) Gems")
                            .font(.title3.bold())
                            .foregroundStyle(GameTheme.accentGold)
                    }
                    if let cosmetic = reward.cosmetic {
                        HStack {
                            Text("\(cosmetic.emoji) \(cosmetic.name)")
                                .font(.title3.bold())
                                .foregroundStyle(GameTheme.accentPurple)
                        }
                    }
                }
                
                Button("Collect") { onDismiss() }
                    .buttonStyle(GlowButtonStyle())
            }
            .padding(32)
            .gameCard()
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(reward.isRare ? GameTheme.accentGold : GameTheme.accentPurple, lineWidth: 2)
                    .shadow(color: (reward.isRare ? GameTheme.accentGold : GameTheme.accentPurple).opacity(0.5), radius: 16)
            )
            .padding(.horizontal, 40)
        }
    }
}

struct RunOverlayView: View {
    @EnvironmentObject var gameState: GameState
    
    var body: some View {
        VStack {
            HStack {
                Circle()
                    .fill(Color.red)
                    .frame(width: 10, height: 10)
                Text("RUNNING")
                    .font(.caption.bold())
                    .foregroundStyle(.red)
                if gameState.isGhostRunActive {
                    Text("👻 GHOST")
                        .font(.caption.bold())
                        .foregroundStyle(GameTheme.accentPurple)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 6)
            .background(Capsule().fill(Color.black.opacity(0.7)))
            .padding(.top, 100)
            Spacer()
        }
    }
}

struct GhostRunPickerView: View {
    @EnvironmentObject var gameState: GameState
    let onSelect: (GhostRun) -> Void
    let onDismiss: () -> Void
    
    var body: some View {
        ZStack {
            Color.black.opacity(0.6)
                .ignoresSafeArea()
                .onTapGesture { onDismiss() }
            
            VStack(spacing: 16) {
                Text("👻 Ghost Run")
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                
                Text("Race against a previous run!")
                    .font(.subheadline)
                    .foregroundStyle(GameTheme.textSecondary)
                
                ForEach(gameState.ghostRuns) { run in
                    Button {
                        onSelect(run)
                    } label: {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(run.routeName)
                                    .font(.headline)
                                    .foregroundStyle(.white)
                                Text(String(format: "%.1f mi · %d XP", run.distanceMiles, run.xpEarned))
                                    .font(.caption)
                                    .foregroundStyle(GameTheme.textSecondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundStyle(GameTheme.accentPurple)
                        }
                        .padding()
                        .gameCard()
                    }
                }
                
                Button("Cancel") { onDismiss() }
                    .buttonStyle(SecondaryButtonStyle())
            }
            .padding()
            .padding(.horizontal)
        }
    }
}

#Preview {
    MapScreen()
        .environmentObject(GameState())
}
