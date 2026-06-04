import SwiftUI

enum GameTheme {
    static let backgroundDark = Color(red: 0.06, green: 0.06, blue: 0.12)
    static let cardBackground = Color(red: 0.12, green: 0.12, blue: 0.22)
    static let cardBorder = Color(red: 0.25, green: 0.25, blue: 0.45)
    
    static let accentBlue = Color(red: 0.25, green: 0.55, blue: 1.0)
    static let accentPurple = Color(red: 0.55, green: 0.25, blue: 0.95)
    static let accentGold = Color(red: 1.0, green: 0.78, blue: 0.2)
    static let accentGreen = Color(red: 0.2, green: 0.85, blue: 0.55)
    
    static let textPrimary = Color.white
    static let textSecondary = Color(white: 0.65)
    static let textMuted = Color(white: 0.45)
    
    static let fogDark = Color.black.opacity(0.75)
    static let fogClear = Color.clear
    
    static let primaryGradient = LinearGradient(
        colors: [accentBlue, accentPurple],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let goldGradient = LinearGradient(
        colors: [Color(red: 1.0, green: 0.85, blue: 0.3), accentGold, Color(red: 0.85, green: 0.55, blue: 0.1)],
        startPoint: .top,
        endPoint: .bottom
    )
    
    static let cardGradient = LinearGradient(
        colors: [cardBackground, Color(red: 0.08, green: 0.08, blue: 0.18)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

struct GameCard: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(GameTheme.cardGradient)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(GameTheme.cardBorder.opacity(0.5), lineWidth: 1)
                    )
            )
    }
}

struct GlowButtonStyle: ButtonStyle {
    var color: Color = GameTheme.accentGold
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline.bold())
            .foregroundStyle(.black)
            .padding(.horizontal, 24)
            .padding(.vertical, 14)
            .background(
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [color, color.opacity(0.7)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .shadow(color: color.opacity(0.6), radius: configuration.isPressed ? 4 : 12)
            )
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.bold())
            .foregroundStyle(GameTheme.accentBlue)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(
                Capsule()
                    .stroke(GameTheme.accentBlue.opacity(0.6), lineWidth: 1.5)
                    .background(Capsule().fill(GameTheme.accentBlue.opacity(0.1)))
            )
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
    }
}

struct XPProgressBar: View {
    let progress: Double
    let level: Int
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("Level \(level)")
                    .font(.caption.bold())
                    .foregroundStyle(GameTheme.accentGold)
                Spacer()
                Text("\(Int(progress * 100))%")
                    .font(.caption2)
                    .foregroundStyle(GameTheme.textSecondary)
            }
            
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.white.opacity(0.1))
                    
                    Capsule()
                        .fill(GameTheme.primaryGradient)
                        .frame(width: geo.size.width * min(max(progress, 0), 1))
                        .shadow(color: GameTheme.accentPurple.opacity(0.5), radius: 4)
                }
            }
            .frame(height: 10)
        }
    }
}

extension View {
    func gameCard() -> some View {
        modifier(GameCard())
    }
}
