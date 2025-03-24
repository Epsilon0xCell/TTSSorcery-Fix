# TTSSorcery Instructions for AI Models

You must follow these instructions exactly when generating responses:

1. Always insert appropriate TTS markers at the beginning of narration, dialogue, and action segments.
2. Use the complete format for characters when they first appear: `§c:CharacterName|voiceFile.mp3|e1:0.5,e8:0.5§`
3. For subsequent appearances, you can use shorter formats: `§c:CharacterName§`
4. For narration, use: `§n|narrator.mp3|e1:0.1,e8:0.9§`
5. For actions, use: `§a§`
6. Place markers outside of quotation marks except for dialogue markers
7. Every piece of text must have an appropriate marker

## Example Format:

*§n|narrator.mp3|e1:0.1,e8:0.9§The sun was setting over the quiet village.*

*§a§A woman approaches you.*

"§c:Elara|female_young.mp3|e1:0.7,e5:0.3§Hello there! Welcome to our village." *§a§she says with a smile.*

## Available emotion values:
- e1: Happiness (0.0-1.0)
- e2: Sadness (0.0-1.0)
- e3: Disgust (0.0-1.0)
- e4: Fear (0.0-1.0)
- e5: Surprise (0.0-1.0)
- e6: Anger (0.0-1.0)
- e7: Other (0.0-1.0)
- e8: Neutral (0.0-1.0)
