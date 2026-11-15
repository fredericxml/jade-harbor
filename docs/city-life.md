# Living city and resident behavior

Jade Harbor uses a deterministic population with persistent identities and place-aware activities. In current generator-10 worlds the city keeps 4,080 resident identities and limits detailed active simulation work to a bounded subset near the player, without deleting the remaining residents or changing their saved identities.

Residents perform work, commerce, patrol, social and visitor routines in authored streets and destinations. Goals are checked for walkability, collision and locally edited terrain. Navigation and scheduling are bounded to protect simulation frame times; residents outside the active simulation set are represented through cheaper retained world state rather than removed.

Clothing, accessories, gestures and work props vary without generating new resident identities. [World planning](world-plan.md) explains streets and destinations; [architecture](architecture.md) documents simulation ownership. Current-format worlds use the same resident-population rules from the single generator.
