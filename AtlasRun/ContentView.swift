import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            MapScreen()
                .tabItem {
                    Label("Map", systemImage: "map.fill")
                }
                .tag(0)
            
            QuestsScreen()
                .tabItem {
                    Label("Quests", systemImage: "scroll.fill")
                }
                .tag(1)
            
            ProfileScreen()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(2)
            
            FriendsScreen()
                .tabItem {
                    Label("Friends", systemImage: "person.2.fill")
                }
                .tag(3)
            
            ShopScreen()
                .tabItem {
                    Label("Shop", systemImage: "bag.fill")
                }
                .tag(4)
        }
        .tint(GameTheme.accentGold)
    }
}

#Preview {
    ContentView()
        .environmentObject(GameState())
}
