# Friends feature prompts

## Original prompt

> hmm, ability to share games, or combine to see fun facts for multiple emails, hmm, either one additional or ability to add, saved via localforage, maybe gear icon is drop down to choose All, or by list of emails added, with an item at the bottom for Edit that leads to existing modal, but with way to add "friends", then in all games when viewing friends or combined, ability to "copy" or add to mine, ah, then can get rid of all qr code stuff, since id have my friends email in there too, and be able to see games we played with their phone, and i can just copy to my email, b, b, blah, plan here, ask me what i am not thinking about

## Clarifying questions and answers

- **Duplicate games across emails?** Dedupe by game end timestamp + players.
- **How should the gear dropdown selection work?** Allow multi-select of which emails to combine.
- **Where do new games save when viewing a friend or combined list?** Always to my (primary) email, regardless of the view.
- **QR code share/scan feature?** Remove entirely (qr.ts, QR UI, payload helpers, qrcode deps).
- **What should "copy to mine" do?** Copy only to my primary email; button hidden for games already mine.

## Follow-up prompts

> gear popup stuck in navbar, doesn't draw below header, always update friends.md

> emails spill out of gear popup, should ellipsis

> maybe popup can be full width
