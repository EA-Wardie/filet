# Regenerates the README screenshots in assets/ using the demo home directory
# from scripts/demo.sh, so they don't show your username or files.
# Usage: bun run screenshots

Output dist/screenshots.gif

Require bwrap
Require bun

Set Shell bash
Set FontFamily "JetBrainsMono Nerd Font"
Set FontSize 19
Set Width 2536
Set Height 1536
Set Padding 0
Set TypingSpeed 0

# Each shot starts in /home/demo with Documents selected, moves down to
# Pictures and opens it, which selects Development.

Hide
Type "bash scripts/demo.sh dark"
Enter
Sleep 2s
Type "jjj"
Enter
Sleep 500ms
Show
Sleep 200ms
Screenshot assets/screenshot_1.png
Hide
Type "q"
Sleep 300ms
Enter
Sleep 1s

Type "bash scripts/demo.sh light"
Enter
Sleep 2s
Type "jjj"
Enter
Sleep 500ms
Show
Sleep 200ms
Screenshot assets/screenshot_2.png
Hide
Type "q"
Sleep 300ms
Enter
Sleep 1s

Type "bash scripts/demo.sh blue"
Enter
Sleep 2s
Type "jjj"
Enter
Sleep 500ms
Show
Sleep 200ms
Screenshot assets/screenshot_3.png
Hide
Type "q"
Sleep 300ms
Enter
Sleep 1s

Type "bash scripts/demo.sh purple"
Enter
Sleep 2s
Type "jjj"
Enter
Sleep 500ms
Show
Sleep 200ms
Screenshot assets/screenshot_4.png
Hide
Type "q"
Sleep 300ms
Enter
Sleep 1s
