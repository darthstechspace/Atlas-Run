import Foundation
import CoreLocation

enum LocationPrivacy {
    private static let gridDeg: Double = 0.0045

    private static func stableHash(_ input: String) -> UInt32 {
        var h: UInt32 = 0
        for char in input.unicodeScalars {
            h = h &* 31 &+ char.value
        }
        return h
    }

    static func obfuscateCoordinate(lat: Double, lng: Double, userId: String) -> CLLocationCoordinate2D {
        let h = stableHash(userId.isEmpty ? "local" : userId)
        let offsetLat = (Double(h % 1000) / 1000.0 - 0.5) * gridDeg * 0.4
        let offsetLng = (Double((h >> 10) % 1000) / 1000.0 - 0.5) * gridDeg * 0.4
        let gridLat = (lat / gridDeg).rounded() * gridDeg + offsetLat
        let gridLng = (lng / gridDeg).rounded() * gridDeg + offsetLng
        return CLLocationCoordinate2D(latitude: gridLat, longitude: gridLng)
    }

    static func resolvePublicLocation(
        lat: Double,
        lng: Double,
        safeModeEnabled: Bool,
        userId: String = "local"
    ) -> CLLocationCoordinate2D {
        if safeModeEnabled {
            return obfuscateCoordinate(lat: lat, lng: lng, userId: userId)
        }
        return CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}
