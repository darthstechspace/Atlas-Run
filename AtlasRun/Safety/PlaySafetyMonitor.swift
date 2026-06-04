import Foundation
import CoreLocation

enum PlaySafetyLevel {
    case ok
    case warn
    case drive
}

struct PlaySafetyMonitor {
    static let warnSpeedMps: Double = 8
    static let driveSpeedMps: Double = 11
    static let sustainedSec: TimeInterval = 5

    private var sustainedWarnSince: Date?
    private var sustainedDriveSince: Date?

    mutating func evaluate(speedMps: Double, now: Date = Date()) -> PlaySafetyLevel {
        guard speedMps >= 0 else { return .ok }

        if speedMps >= Self.driveSpeedMps {
            let driveSince = sustainedDriveSince ?? now
            sustainedDriveSince = driveSince
            sustainedWarnSince = nil
            if now.timeIntervalSince(driveSince) >= Self.sustainedSec {
                return .drive
            }
            return .ok
        }

        if speedMps >= Self.warnSpeedMps {
            let warnSince = sustainedWarnSince ?? now
            sustainedWarnSince = warnSince
            sustainedDriveSince = nil
            if now.timeIntervalSince(warnSince) >= Self.sustainedSec {
                return .warn
            }
            return .ok
        }

        sustainedWarnSince = nil
        sustainedDriveSince = nil
        return .ok
    }

    static func message(for level: PlaySafetyLevel) -> String? {
        switch level {
        case .warn:
            return "Slow down. Stay aware of your surroundings."
        case .drive:
            return "Don't play while driving. Stop and end your run."
        case .ok:
            return nil
        }
    }
}
