# Resident routines and visible activity

The city's activity is designed to look connected to the places where it happens. Residents do not simply wander through arbitrary points: nearby actors move between supported destinations such as shopfronts, workshops, quays, guard posts, pavilions, gardens, doorways, and meeting places.

## Actions you may notice

| Resident role or place | Example activity |
|---|---|
| Market shops | Browsing, greeting, serving, arranging goods, restocking, and carrying items |
| Hutong lanes | Neighbor greetings, short conversations, sweeping, checking a lane, and household shopping |
| Water Town | Bridge and viewpoint visits, canal-side shopping, tea service, and quay conversation |
| Harbor | Cargo movement, stock inspection, dock commerce, and guard posts |
| Imperial and civic spaces | Watch duties, visitor routes, and attendant activity |
| Artisan workyards | Hammering, inspecting, shaping, supply trips, and workshop maintenance |
| Scholar gardens | Reading, observing, studying, pavilion maintenance, and companion visits |
| Nightlife streets | Tea service, venue visits, shopping, conversation, and lantern work |
| Highlands and regional villages | Ridge watches, lookout visits, inn service, orchard work, and local meetings |

A resident generally moves to a place, performs a short action, and then continues to another nearby destination. The activity is tied to the resident's role and schedule.

## Appearance and movement

Clothing colors, headwear, proportions, work aprons, and carried props help distinguish different roles. Small gestures—such as reaching, arranging, hammering, sweeping, greeting, reading, or keeping watch—make an action easier to recognize.

Movement uses the same world support, doors, collision, and navigation rules as ordinary resident travel. Player edits can block an optional route; residents do not rebuild the world to reach a task. Visible residents are not repositioned around the camera simply to create the appearance of a crowd.

## Time, weather, and local variation

Work, home, public activity, and nightlife follow the shared world clock. Guards remain on watch at night; some commercial and tea-house roles stay active later than daytime workers. Rain reduces optional outdoor social activity, while core work and patrols continue.

The exact mix changes with the district, time, weather, and which residents are nearby. Not every resident is part of a group or gathering.

## Performance and simulation boundaries

The 4,080 resident identities remain persistent, while detailed local movement is bounded to at most 96 active residents. Distant residents keep their identity and coarse schedule state; they do not all run continuous off-screen pathfinding or full physics.

The renderer can simplify far-away resident visuals according to the graphics preset. This changes presentation only: it does not remove residents or change their saved identities, roles, schedules, or gameplay state.

This is ambient city life, not a full production economy, long-form dialogue system, quest campaign, or unlimited crowd simulation. See [graphics and performance](performance.md) for the relationship between resident rendering and graphics quality.
