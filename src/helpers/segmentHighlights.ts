import OwnershipMediator from "./ownershipMediator";
import SegmentIdGenerator from "./segmentIdGenerator";
import sectionEnabled from "./sectionEnabled";

// Temporary hardcoded word-level timing data keyed by segment marker
const WORD_TIMINGS_BY_MARKER = {
  // Title: "BeyondWords Player"
  "cbe5f90b-0e73-4135-967a-a6241e3f02ee": [
    { text: "BeyondWords", start_time: 50, duration: 675, start_index: 72, end_index: 83 },
    { text: "Player", start_time: 738, duration: 488, start_index: 84, end_index: 90 },
  ],
  // Body 1: "This is a demo page for the BeyondWords Player..."
  "7dbf51e6-f8e7-4c17-85f5-3614d3dc096d": [
    { text: "This", start_time: 50, duration: 225, start_index: 72, end_index: 76 },
    { text: "is", start_time: 288, duration: 113, start_index: 77, end_index: 79 },
    { text: "a", start_time: 413, duration: 88, start_index: 80, end_index: 81 },
    { text: "demo", start_time: 513, duration: 300, start_index: 82, end_index: 86 },
    { text: "page", start_time: 825, duration: 388, start_index: 87, end_index: 91 },
    { text: "for", start_time: 1263, duration: 113, start_index: 92, end_index: 95 },
    { text: "the", start_time: 1388, duration: 88, start_index: 96, end_index: 99 },
    { text: "BeyondWords", start_time: 1488, duration: 675, start_index: 100, end_index: 111 },
    { text: "Player.", start_time: 2175, duration: 575, start_index: 112, end_index: 119 },
    { text: "As", start_time: 3500, duration: 213, start_index: 120, end_index: 122 },
    { text: "you", start_time: 3725, duration: 100, start_index: 123, end_index: 126 },
    { text: "listen", start_time: 3838, duration: 275, start_index: 127, end_index: 133 },
    { text: "to", start_time: 4125, duration: 88, start_index: 134, end_index: 136 },
    { text: "the", start_time: 4225, duration: 113, start_index: 137, end_index: 140 },
    { text: "audio,", start_time: 4350, duration: 663, start_index: 141, end_index: 147 },
    { text: "the", start_time: 5013, duration: 100, start_index: 148, end_index: 151 },
    { text: "player", start_time: 5125, duration: 325, start_index: 152, end_index: 158 },
    { text: "will", start_time: 5463, duration: 163, start_index: 159, end_index: 163 },
    { text: "automatically", start_time: 5638, duration: 563, start_index: 164, end_index: 177 },
    { text: "update", start_time: 6213, duration: 400, start_index: 178, end_index: 184 },
    { text: "to", start_time: 6663, duration: 88, start_index: 185, end_index: 187 },
    { text: "demonstrate", start_time: 6763, duration: 550, start_index: 188, end_index: 199 },
    { text: "its", start_time: 7325, duration: 163, start_index: 200, end_index: 203 },
    { text: "key", start_time: 7500, duration: 213, start_index: 204, end_index: 207 },
    { text: "features.", start_time: 7725, duration: 800, start_index: 208, end_index: 217 },
    { text: "Additionally,", start_time: 9275, duration: 800, start_index: 218, end_index: 231 },
    { text: "on", start_time: 10075, duration: 150, start_index: 232, end_index: 234 },
    { text: "desktop,", start_time: 10238, duration: 775, start_index: 235, end_index: 243 },
    { text: "you", start_time: 11013, duration: 125, start_index: 244, end_index: 247 },
    { text: "can", start_time: 11150, duration: 138, start_index: 248, end_index: 251 },
    { text: "use", start_time: 11300, duration: 225, start_index: 252, end_index: 255 },
    { text: "the", start_time: 11538, duration: 100, start_index: 256, end_index: 259 },
    { text: "control", start_time: 11650, duration: 438, start_index: 260, end_index: 267 },
    { text: "panel", start_time: 12100, duration: 338, start_index: 268, end_index: 273 },
    { text: "on", start_time: 12500, duration: 100, start_index: 274, end_index: 276 },
    { text: "the", start_time: 12613, duration: 63, start_index: 277, end_index: 280 },
    { text: "right", start_time: 12688, duration: 300, start_index: 281, end_index: 286 },
    { text: "to", start_time: 13038, duration: 100, start_index: 287, end_index: 289 },
    { text: "customize", start_time: 13150, duration: 550, start_index: 290, end_index: 299 },
    { text: "the", start_time: 13713, duration: 88, start_index: 300, end_index: 303 },
    { text: "player", start_time: 13813, duration: 438, start_index: 304, end_index: 310 },
    { text: "and", start_time: 14313, duration: 125, start_index: 311, end_index: 314 },
    { text: "inspect", start_time: 14450, duration: 425, start_index: 315, end_index: 322 },
    { text: "its", start_time: 14888, duration: 138, start_index: 323, end_index: 326 },
    { text: "properties.", start_time: 15038, duration: 838, start_index: 327, end_index: 338 },
  ],
  // Body 2: "This page is intended to help integrators..."
  "5cb87696-8333-4874-961d-c0acf3ffdcf8": [
    { text: "This", start_time: 50, duration: 213, start_index: 72, end_index: 76 },
    { text: "page", start_time: 275, duration: 313, start_index: 77, end_index: 81 },
    { text: "is", start_time: 638, duration: 100, start_index: 82, end_index: 84 },
    { text: "intended", start_time: 750, duration: 450, start_index: 85, end_index: 93 },
    { text: "to", start_time: 1213, duration: 88, start_index: 94, end_index: 96 },
    { text: "help", start_time: 1313, duration: 213, start_index: 97, end_index: 101 },
    { text: "integrators", start_time: 1538, duration: 650, start_index: 102, end_index: 113 },
    { text: "understand", start_time: 2250, duration: 550, start_index: 114, end_index: 124 },
    { text: "the", start_time: 2813, duration: 75, start_index: 125, end_index: 128 },
    { text: "capabilities", start_time: 2900, duration: 700, start_index: 129, end_index: 141 },
    { text: "of", start_time: 3613, duration: 75, start_index: 142, end_index: 144 },
    { text: "the", start_time: 3700, duration: 88, start_index: 145, end_index: 148 },
    { text: "player", start_time: 3800, duration: 475, start_index: 149, end_index: 155 },
    { text: "and", start_time: 4338, duration: 75, start_index: 156, end_index: 159 },
    { text: "to", start_time: 4425, duration: 88, start_index: 160, end_index: 162 },
    { text: "make", start_time: 4525, duration: 175, start_index: 163, end_index: 167 },
    { text: "it", start_time: 4713, duration: 113, start_index: 168, end_index: 170 },
    { text: "easier", start_time: 4838, duration: 338, start_index: 171, end_index: 177 },
    { text: "to", start_time: 5188, duration: 88, start_index: 178, end_index: 180 },
    { text: "add", start_time: 5288, duration: 200, start_index: 181, end_index: 184 },
    { text: "the", start_time: 5500, duration: 75, start_index: 185, end_index: 188 },
    { text: "player", start_time: 5588, duration: 400, start_index: 189, end_index: 195 },
    { text: "to", start_time: 6063, duration: 88, start_index: 196, end_index: 198 },
    { text: "your", start_time: 6163, duration: 113, start_index: 199, end_index: 203 },
    { text: "website.", start_time: 6288, duration: 675, start_index: 204, end_index: 212 },
    { text: "For", start_time: 7713, duration: 238, start_index: 213, end_index: 216 },
    { text: "more", start_time: 7963, duration: 213, start_index: 217, end_index: 221 },
    { text: "detailed", start_time: 8188, duration: 413, start_index: 222, end_index: 230 },
    { text: "documentation,", start_time: 8613, duration: 1025, start_index: 231, end_index: 245 },
    { text: "please", start_time: 9638, duration: 275, start_index: 246, end_index: 252 },
    { text: "refer", start_time: 9925, duration: 250, start_index: 253, end_index: 258 },
    { text: "to", start_time: 10188, duration: 75, start_index: 259, end_index: 261 },
    { text: "the", start_time: 10275, duration: 88, start_index: 262, end_index: 265 },
    { text: "player", start_time: 10375, duration: 288, start_index: 266, end_index: 272 },
    { text: "repository", start_time: 10675, duration: 675, start_index: 273, end_index: 283 },
    { text: "on", start_time: 11363, duration: 113, start_index: 284, end_index: 286 },
    { text: "GitHub", start_time: 11488, duration: 438, start_index: 287, end_index: 293 },
    { text: "which", start_time: 11975, duration: 163, start_index: 294, end_index: 299 },
    { text: "includes", start_time: 12150, duration: 375, start_index: 300, end_index: 308 },
    { text: "guides", start_time: 12538, duration: 375, start_index: 309, end_index: 315 },
    { text: "and", start_time: 12950, duration: 100, start_index: 316, end_index: 319 },
    { text: "reference", start_time: 13063, duration: 363, start_index: 320, end_index: 329 },
    { text: "material.", start_time: 13438, duration: 725, start_index: 330, end_index: 339 },
  ],
  // Body 3: "The explanations on this page..."
  "677d53fe-29ea-433a-9976-6dbbd4882bf0": [
    { text: "The", start_time: 50, duration: 113, start_index: 72, end_index: 75 },
    { text: "explanations", start_time: 175, duration: 800, start_index: 76, end_index: 88 },
    { text: "on", start_time: 988, duration: 100, start_index: 89, end_index: 91 },
    { text: "this", start_time: 1100, duration: 163, start_index: 92, end_index: 96 },
    { text: "page", start_time: 1275, duration: 338, start_index: 97, end_index: 101 },
    { text: "are", start_time: 1675, duration: 138, start_index: 102, end_index: 105 },
    { text: "split", start_time: 1825, duration: 300, start_index: 106, end_index: 111 },
    { text: "into", start_time: 2138, duration: 213, start_index: 112, end_index: 116 },
    { text: "sections.", start_time: 2363, duration: 863, start_index: 117, end_index: 126 },
    { text: "You", start_time: 3975, duration: 163, start_index: 127, end_index: 130 },
    { text: "can", start_time: 4150, duration: 163, start_index: 131, end_index: 134 },
    { text: "click", start_time: 4325, duration: 275, start_index: 135, end_index: 140 },
    { text: "on", start_time: 4613, duration: 75, start_index: 141, end_index: 143 },
    { text: "the", start_time: 4700, duration: 75, start_index: 144, end_index: 147 },
    { text: "playlist", start_time: 4788, duration: 475, start_index: 148, end_index: 156 },
    { text: "icon", start_time: 5275, duration: 400, start_index: 157, end_index: 161 },
    { text: "in", start_time: 5688, duration: 75, start_index: 162, end_index: 164 },
    { text: "the", start_time: 5775, duration: 75, start_index: 165, end_index: 168 },
    { text: "player", start_time: 5863, duration: 338, start_index: 169, end_index: 175 },
    { text: "above", start_time: 6213, duration: 288, start_index: 176, end_index: 181 },
    { text: "to", start_time: 6513, duration: 100, start_index: 182, end_index: 184 },
    { text: "jump", start_time: 6625, duration: 275, start_index: 185, end_index: 189 },
    { text: "to", start_time: 6913, duration: 100, start_index: 190, end_index: 192 },
    { text: "a", start_time: 7025, duration: 75, start_index: 193, end_index: 194 },
    { text: "specific", start_time: 7113, duration: 538, start_index: 195, end_index: 203 },
    { text: "section", start_time: 7663, duration: 475, start_index: 204, end_index: 211 },
    { text: "to", start_time: 8200, duration: 88, start_index: 212, end_index: 214 },
    { text: "hear", start_time: 8300, duration: 175, start_index: 215, end_index: 219 },
    { text: "about", start_time: 8488, duration: 200, start_index: 220, end_index: 225 },
    { text: "a", start_time: 8700, duration: 50, start_index: 226, end_index: 227 },
    { text: "particular", start_time: 8763, duration: 588, start_index: 228, end_index: 238 },
    { text: "feature.", start_time: 9363, duration: 613, start_index: 239, end_index: 247 },
    { text: "If", start_time: 10725, duration: 150, start_index: 248, end_index: 250 },
    { text: "you", start_time: 10888, duration: 113, start_index: 251, end_index: 254 },
    { text: "have", start_time: 11013, duration: 175, start_index: 255, end_index: 259 },
    { text: "any", start_time: 11200, duration: 213, start_index: 260, end_index: 263 },
    { text: "feedback", start_time: 11425, duration: 425, start_index: 264, end_index: 272 },
    { text: "on", start_time: 11863, duration: 75, start_index: 273, end_index: 275 },
    { text: "this", start_time: 11950, duration: 150, start_index: 276, end_index: 280 },
    { text: "page,", start_time: 12113, duration: 575, start_index: 281, end_index: 286 },
    { text: "please", start_time: 12688, duration: 338, start_index: 287, end_index: 293 },
    { text: "open", start_time: 13038, duration: 225, start_index: 294, end_index: 298 },
    { text: "a", start_time: 13275, duration: 63, start_index: 299, end_index: 300 },
    { text: "GitHub", start_time: 13350, duration: 375, start_index: 301, end_index: 307 },
    { text: "issue.", start_time: 13738, duration: 550, start_index: 308, end_index: 314 },
    { text: "Thank", start_time: 15038, duration: 325, start_index: 315, end_index: 320 },
    { text: "you.", start_time: 15375, duration: 425, start_index: 321, end_index: 325 },
  ],
  // Summary 1: "This demo page showcases the features..."
  "e3643dcb-6df0-438f-a814-b899518eeeab": [
    { text: "This", start_time: 50, duration: 325, start_index: 106, end_index: 110 },
    { text: "demo", start_time: 388, duration: 338, start_index: 111, end_index: 115 },
    { text: "page", start_time: 738, duration: 338, start_index: 116, end_index: 120 },
    { text: "showcases", start_time: 1088, duration: 550, start_index: 121, end_index: 130 },
    { text: "the", start_time: 1650, duration: 88, start_index: 131, end_index: 134 },
    { text: "features", start_time: 1750, duration: 500, start_index: 135, end_index: 143 },
    { text: "of", start_time: 2263, duration: 63, start_index: 144, end_index: 146 },
    { text: "the", start_time: 2338, duration: 88, start_index: 147, end_index: 150 },
    { text: "BeyondWords", start_time: 2438, duration: 700, start_index: 151, end_index: 162 },
    { text: "Player,", start_time: 3150, duration: 825, start_index: 163, end_index: 170 },
    { text: "designed", start_time: 3975, duration: 438, start_index: 171, end_index: 179 },
    { text: "for", start_time: 4413, duration: 175, start_index: 180, end_index: 183 },
    { text: "audio", start_time: 4600, duration: 300, start_index: 184, end_index: 189 },
    { text: "consumption.", start_time: 4913, duration: 775, start_index: 190, end_index: 202 },
  ],
  // Summary 2: "As you listen, the player will automatically update..."
  "75f1b0ea-7801-40f5-b7ab-cce584e42dc6": [
    { text: "As", start_time: 88, duration: 150, start_index: 106, end_index: 108 },
    { text: "you", start_time: 250, duration: 100, start_index: 109, end_index: 112 },
    { text: "listen,", start_time: 350, duration: 675, start_index: 113, end_index: 120 },
    { text: "the", start_time: 1025, duration: 75, start_index: 121, end_index: 124 },
    { text: "player", start_time: 1100, duration: 363, start_index: 125, end_index: 131 },
    { text: "will", start_time: 1475, duration: 175, start_index: 132, end_index: 136 },
    { text: "automatically", start_time: 1713, duration: 663, start_index: 137, end_index: 150 },
    { text: "update", start_time: 2425, duration: 438, start_index: 151, end_index: 157 },
    { text: "to", start_time: 2875, duration: 88, start_index: 158, end_index: 160 },
    { text: "highlight", start_time: 2975, duration: 625, start_index: 161, end_index: 170 },
    { text: "its", start_time: 3675, duration: 250, start_index: 171, end_index: 174 },
    { text: "key", start_time: 3938, duration: 263, start_index: 175, end_index: 178 },
    { text: "functionalities.", start_time: 4213, duration: 1050, start_index: 179, end_index: 195 },
  ],
  // Summary 3: "Integrators can use this page..."
  "fc92ac84-2683-444d-901a-fb1307a06fe6": [
    { text: "Integrators", start_time: 50, duration: 775, start_index: 106, end_index: 117 },
    { text: "can", start_time: 838, duration: 163, start_index: 118, end_index: 121 },
    { text: "use", start_time: 1013, duration: 275, start_index: 122, end_index: 125 },
    { text: "this", start_time: 1288, duration: 188, start_index: 126, end_index: 130 },
    { text: "page", start_time: 1488, duration: 388, start_index: 131, end_index: 135 },
    { text: "to", start_time: 1888, duration: 88, start_index: 136, end_index: 138 },
    { text: "understand", start_time: 1988, duration: 638, start_index: 139, end_index: 149 },
    { text: "how", start_time: 2638, duration: 213, start_index: 150, end_index: 153 },
    { text: "to", start_time: 2863, duration: 175, start_index: 154, end_index: 156 },
    { text: "effectively", start_time: 3038, duration: 675, start_index: 157, end_index: 168 },
    { text: "add", start_time: 3725, duration: 188, start_index: 169, end_index: 172 },
    { text: "the", start_time: 3913, duration: 63, start_index: 173, end_index: 176 },
    { text: "player", start_time: 3988, duration: 350, start_index: 177, end_index: 183 },
    { text: "to", start_time: 4338, duration: 88, start_index: 184, end_index: 186 },
    { text: "their", start_time: 4438, duration: 150, start_index: 187, end_index: 192 },
    { text: "websites.", start_time: 4600, duration: 800, start_index: 193, end_index: 202 },
  ],
  // Summary 4: "For more in-depth information..."
  "cdf21b16-20ad-4358-890f-68f24f913c55": [
    { text: "For", start_time: 75, duration: 138, start_index: 106, end_index: 109 },
    { text: "more", start_time: 225, duration: 275, start_index: 110, end_index: 114 },
    { text: "in-depth", start_time: 513, duration: 500, start_index: 115, end_index: 123 },
    { text: "information,", start_time: 1025, duration: 1188, start_index: 124, end_index: 136 },
    { text: "users", start_time: 2213, duration: 363, start_index: 137, end_index: 142 },
    { text: "are", start_time: 2588, duration: 138, start_index: 143, end_index: 146 },
    { text: "encouraged", start_time: 2738, duration: 650, start_index: 147, end_index: 157 },
    { text: "to", start_time: 3600, duration: 113, start_index: 158, end_index: 160 },
    { text: "visit", start_time: 3725, duration: 288, start_index: 161, end_index: 166 },
    { text: "the", start_time: 4025, duration: 75, start_index: 167, end_index: 170 },
    { text: "player", start_time: 4113, duration: 338, start_index: 171, end_index: 177 },
    { text: "repository", start_time: 4463, duration: 763, start_index: 178, end_index: 188 },
    { text: "on", start_time: 5225, duration: 163, start_index: 189, end_index: 191 },
    { text: "GitHub", start_time: 5400, duration: 313, start_index: 192, end_index: 198 },
    { text: "for", start_time: 5713, duration: 125, start_index: 199, end_index: 202 },
    { text: "guides", start_time: 5850, duration: 450, start_index: 203, end_index: 209 },
    { text: "and", start_time: 6300, duration: 263, start_index: 210, end_index: 213 },
    { text: "reference", start_time: 6638, duration: 388, start_index: 214, end_index: 223 },
    { text: "materials.", start_time: 7038, duration: 825, start_index: 224, end_index: 234 },
  ],
  // Summary 5: "Feedback is welcomed through GitHub issues..."
  "8860a172-41df-4ed6-b64e-26853e1c1740": [
    { text: "Feedback", start_time: 50, duration: 663, start_index: 106, end_index: 114 },
    { text: "is", start_time: 775, duration: 163, start_index: 115, end_index: 117 },
    { text: "welcomed", start_time: 950, duration: 525, start_index: 118, end_index: 126 },
    { text: "through", start_time: 1475, duration: 263, start_index: 127, end_index: 134 },
    { text: "GitHub", start_time: 1750, duration: 363, start_index: 135, end_index: 141 },
    { text: "issues,", start_time: 2125, duration: 763, start_index: 142, end_index: 149 },
    { text: "ensuring", start_time: 2888, duration: 488, start_index: 150, end_index: 158 },
    { text: "continuous", start_time: 3375, duration: 613, start_index: 159, end_index: 169 },
    { text: "improvement", start_time: 4000, duration: 650, start_index: 170, end_index: 181 },
    { text: "of", start_time: 4738, duration: 75, start_index: 182, end_index: 184 },
    { text: "the", start_time: 4825, duration: 75, start_index: 185, end_index: 188 },
    { text: "player", start_time: 4913, duration: 263, start_index: 189, end_index: 195 },
    { text: "experience.", start_time: 5188, duration: 925, start_index: 196, end_index: 207 },
  ],
};

// SVG highlight colors
const PARAGRAPH_HIGHLIGHT_COLOR = "#D2E3FC";
const WORD_HIGHLIGHT_COLOR = "#8AB4F8";
const CORNER_RADIUS = 3;
const WORD_TRANSITION_MS = 120;
const SVG_NS = "http://www.w3.org/2000/svg";

class SegmentHighlights {
  static #mediator = new OwnershipMediator(this.#addHighlights, this.#removeHighlights);
  static #elementState = new WeakMap();
  static #activeHighlights = new Map(); // Track active highlights for word updates
  static #clickHandlers = new WeakMap(); // Track click handlers for cleanup
  static #savedWordState = new WeakMap(); // Persists word rect state across overlay destroy/recreate cycles

  constructor() {
    this.ids = new SegmentIdGenerator();
    this.onEvent = null; // Will be set to emit events for seeking
  }

  update(type, segment, sections, background, currentTime = 0, isPlaying = false, isAdvert = false, currentMarker = null) {
    const enabled = sections.every(s => sectionEnabled(type, segment, s));

    const previous = this[`prev${type}`];
    const current = enabled ? this.ids.fetchOrAdd(segment) : null;

    if (current) {
      // Only update mediator ownership when segment changes (not on every currentTime tick)
      // to avoid stacking consumer entries that prevent proper cleanup on segment change
      if (current !== previous) {
        SegmentHighlights.#mediator.addInterest(current, this, this, segment, background);
      }
      // Update word highlighting based on current time
      this.#updateWordHighlight(segment, currentTime, isPlaying, isAdvert, currentMarker);
    }
    if (previous && previous !== current) {
      SegmentHighlights.#mediator.removeInterest(previous, this);
    }

    this[`prev${type}`] = current;
  }

  reset(type) {
    this.update(type, null, ["none"], null, 0, false, false, null);
  }

  // Update word highlighting for active segment based on current playback time
  #updateWordHighlight(segment, currentTime, isPlaying, isAdvert: boolean, currentMarker: string | null) {
    if (!segment?.segmentElement) return;

    const segmentStartTime = segment.startTime || 0; // in seconds
    const timeInSegmentMs = (currentTime - segmentStartTime) * 1000; // convert to ms relative to segment start

    // Suppress word highlights if an advert is playing or this segment isn't the currently playing one
    const suppressWords = isAdvert || (segment.marker !== currentMarker);

    for (const element of this.#highlightElements(segment)) {
      const state = SegmentHighlights.#elementState.get(element);
      if (!state?.wordRect) continue;

      const highlightData = SegmentHighlights.#activeHighlights.get(element);
      if (!highlightData) continue;

      const containerRect = element.getBoundingClientRect();

      // Rebuild overlay if container resized
      if (Math.abs(containerRect.width - state.cachedWidth) > 1 || Math.abs(containerRect.height - state.cachedHeight) > 1) {
        SegmentHighlights.#rebuildOverlay(state, highlightData, containerRect);
      }

      const currentWordIndex = suppressWords ? -1 : SegmentHighlights.#findCurrentWordIndex(timeInSegmentMs, highlightData.wordRanges);

      // Store playing state for click handler
      highlightData.isPlaying = isPlaying;

      // Only update word rect DOM when word index changes (CSS transition handles animation)
      if (currentWordIndex !== highlightData.currentWordIndex) {
        highlightData.currentWordIndex = currentWordIndex;

        if (currentWordIndex >= 0 && currentWordIndex < highlightData.wordRanges.length) {
          const currentWord = highlightData.wordRanges[currentWordIndex];
          const wordRects = SegmentHighlights.#getRangeRects(
            highlightData.charMap, currentWord.start_index, currentWord.end_index, containerRect
          );

          if (wordRects.length > 0) {
            // Use bounding box of all rects (handles rare multi-line word wrapping)
            const r = wordRects.length === 1 ? wordRects[0] : {
              x: Math.min(...wordRects.map(r => r.x)),
              y: Math.min(...wordRects.map(r => r.y)),
              width: Math.max(...wordRects.map(r => r.x + r.width)) - Math.min(...wordRects.map(r => r.x)),
              height: Math.max(...wordRects.map(r => r.y + r.height)) - Math.min(...wordRects.map(r => r.y)),
            };

            state.wordRect.style.x = `${r.x}px`;
            state.wordRect.style.y = `${r.y}px`;
            state.wordRect.style.width = `${r.width}px`;
            state.wordRect.style.height = `${r.height}px`;
            state.wordRect.style.opacity = "1";
          }
        } else {
          // No active word — fade out in place
          state.wordRect.style.opacity = "0";
        }
      }
    }
  }

  // Build highlight data: character map and word ranges by finding words in DOM text
  static #buildHighlightData(element) {
    const charMap = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    let fullText = "";

    // Build character map and full text from DOM text nodes
    while ((node = walker.nextNode())) {
      const text = node.nodeValue || "";
      for (let i = 0; i < text.length; i++) {
        charMap.push({ node, offset: i });
        fullText += text[i];
      }
    }

    // Look up word timings by segment marker
    const marker = element.getAttribute("data-beyondwords-marker");
    const wordTimings = (marker && WORD_TIMINGS_BY_MARKER[marker]) || [];

    // Find each word sequentially in the clean DOM text to get correct charMap indices
    const trimmedText = fullText.replace(/^\s+/, "");
    const leadingWhitespace = fullText.length - trimmedText.length;
    const wordRanges = [];
    let searchPos = leadingWhitespace;

    for (const wordTiming of wordTimings) {
      const wordText = wordTiming.text;
      const foundPos = fullText.indexOf(wordText, searchPos);

      if (foundPos !== -1) {
        wordRanges.push({
          start_index: foundPos,
          end_index: foundPos + wordText.length,
          start_time: wordTiming.start_time,
          duration: wordTiming.duration,
          text: wordText,
        });
        searchPos = foundPos + wordText.length;
      }
    }

    return { charMap, wordRanges, currentWordIndex: -1 };
  }

  // Get bounding rects for a character range using document.createRange
  static #getRangeRects(charMap, startIndex, endIndex, containerRect) {
    if (startIndex >= charMap.length || endIndex > charMap.length) {
      return [];
    }

    const startPoint = charMap[startIndex];
    const endPoint = charMap[Math.min(endIndex - 1, charMap.length - 1)];

    if (!startPoint || !endPoint) {
      return [];
    }

    const range = document.createRange();
    try {
      range.setStart(startPoint.node, startPoint.offset);
      range.setEnd(endPoint.node, endPoint.offset + 1);
    } catch (e) {
      return [];
    }

    const rects = Array.from(range.getClientRects());

    // Convert to relative coordinates
    return rects.map(rect => ({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
      width: rect.width,
      height: rect.height,
    }));
  }

  // Get text line rects from character map (avoids contamination from overlay SVG elements)
  static #getTextRects(charMap: {node: Node, offset: number}[], containerRect: DOMRect) {
    if (charMap.length === 0) return [];

    const first = charMap[0];
    const last = charMap[charMap.length - 1];

    const range = document.createRange();
    try {
      range.setStart(first.node, first.offset);
      range.setEnd(last.node, last.offset + 1);
    } catch (e) {
      return [];
    }

    return Array.from(range.getClientRects()).map(rect => ({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
      width: rect.width,
      height: rect.height,
    }));
  }

  // Generate SVG path for a rounded rectangle
  static #roundedRectPath(x, y, width, height, r) {
    return `
      M${x + r},${y}
      h${width - 2 * r}
      q${r},0 ${r},${r}
      v${height - 2 * r}
      q0,${r} -${r},${r}
      h-${width - 2 * r}
      q-${r},0 -${r},-${r}
      v-${height - 2 * r}
      q0,-${r} ${r},-${r}
      z`;
  }

  // Find current word index based on playback time (milliseconds from segment start)
  static #findCurrentWordIndex(currentTimeMs, wordRanges) {
    for (let i = 0; i < wordRanges.length; i++) {
      const word = wordRanges[i];
      const wordEnd = word.start_time + word.duration;
      if (currentTimeMs >= word.start_time && currentTimeMs < wordEnd) {
        return i;
      }
    }
    return -1;
  }

  // Find which word was clicked based on click coordinates
  static #findWordAtPoint(x, y, highlightData, element) {
    const { charMap, wordRanges } = highlightData;

    for (let i = 0; i < wordRanges.length; i++) {
      const word = wordRanges[i];
      const startPoint = charMap[word.start_index];
      const endPoint = charMap[Math.min(word.end_index - 1, charMap.length - 1)];

      if (!startPoint || !endPoint) continue;

      const range = document.createRange();
      try {
        range.setStart(startPoint.node, startPoint.offset);
        range.setEnd(endPoint.node, endPoint.offset + 1);
      } catch (e) {
        continue;
      }

      const rects = range.getClientRects();
      for (const rect of rects) {
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return i;
        }
      }
    }
    return -1;
  }

  // Rebuild overlay SVG when the container resizes
  static #rebuildOverlay(
    state: { cachedWidth: number; cachedHeight: number; overlaySvg: SVGSVGElement; paragraphGroup: SVGGElement },
    highlightData: { charMap: {node: Node; offset: number}[] },
    containerRect: DOMRect,
  ) {
    state.cachedWidth = containerRect.width;
    state.cachedHeight = containerRect.height;

    state.overlaySvg.setAttribute("width", String(containerRect.width));
    state.overlaySvg.setAttribute("height", String(containerRect.height));

    // Clear and rebuild paragraph paths
    const pg = state.paragraphGroup;
    while (pg.firstChild) pg.removeChild(pg.firstChild);

    const textRects = SegmentHighlights.#getTextRects(highlightData.charMap, containerRect);
    for (const rect of textRects) {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", SegmentHighlights.#roundedRectPath(rect.x, rect.y, rect.width, rect.height, CORNER_RADIUS));
      path.setAttribute("fill", PARAGRAPH_HIGHLIGHT_COLOR);
      pg.appendChild(path);
    }
  }

  static #addHighlights(uniqueId, self, segment, background) {
    for (const element of self.#highlightElements(segment)) {
      // Save original styles that we will modify
      const originalStyles = {
        position: element.style.position,
        isolation: element.style.isolation,
        cursor: element.style.cursor,
      };

      // Build highlight data BEFORE inserting overlay to avoid contaminating DOM measurements
      const highlightData = SegmentHighlights.#buildHighlightData(element);
      SegmentHighlights.#activeHighlights.set(element, highlightData);

      // Establish positioning context for the overlay
      const computed = getComputedStyle(element);
      if (computed.position === "static") {
        element.style.position = "relative";
      }
      element.style.isolation = "isolate";

      const containerRect = element.getBoundingClientRect();

      // Account for border: absolute positioning starts at the padding box,
      // but containerRect is the border box. Offset the SVG so its origin
      // matches the border box origin used by our rect calculations.
      const borderLeft = parseFloat(computed.borderLeftWidth) || 0;
      const borderTop = parseFloat(computed.borderTopWidth) || 0;

      // Create single overlay SVG (z-index: -1 places it behind normal-flow text)
      const overlaySvg = document.createElementNS(SVG_NS, "svg");
      overlaySvg.style.position = "absolute";
      overlaySvg.style.top = `${-borderTop}px`;
      overlaySvg.style.left = `${-borderLeft}px`;
      overlaySvg.style.zIndex = "-1";
      overlaySvg.style.pointerEvents = "none";
      overlaySvg.style.overflow = "visible";
      overlaySvg.setAttribute("width", String(containerRect.width));
      overlaySvg.setAttribute("height", String(containerRect.height));

      // Paragraph highlight group (rendered first → visually behind word highlight)
      const paragraphGroup = document.createElementNS(SVG_NS, "g");
      const textRects = SegmentHighlights.#getTextRects(highlightData.charMap, containerRect);
      for (const rect of textRects) {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", SegmentHighlights.#roundedRectPath(rect.x, rect.y, rect.width, rect.height, CORNER_RADIUS));
        path.setAttribute("fill", PARAGRAPH_HIGHLIGHT_COLOR);
        paragraphGroup.appendChild(path);
      }
      overlaySvg.appendChild(paragraphGroup);

      // Single reusable word highlight rect (rendered second → visually above paragraph)
      const wordRect = document.createElementNS(SVG_NS, "rect");
      wordRect.setAttribute("rx", String(CORNER_RADIUS));
      wordRect.setAttribute("ry", String(CORNER_RADIUS));
      wordRect.setAttribute("fill", WORD_HIGHLIGHT_COLOR);
      wordRect.style.opacity = "0";
      wordRect.style.x = "0px";
      wordRect.style.y = "0px";
      wordRect.style.width = "0px";
      wordRect.style.height = "0px";
      wordRect.style.transition = [
        `x ${WORD_TRANSITION_MS}ms ease-out`,
        `y ${WORD_TRANSITION_MS}ms ease-out`,
        `width ${WORD_TRANSITION_MS}ms ease-out`,
        `height ${WORD_TRANSITION_MS}ms ease-out`,
        `opacity ${WORD_TRANSITION_MS}ms ease-out`,
      ].join(", ");
      overlaySvg.appendChild(wordRect);

      // Insert overlay as first child so it renders behind text content
      element.prepend(overlaySvg);

      // Store DOM references and cached dimensions for resize detection
      SegmentHighlights.#elementState.set(element, {
        uniqueId,
        originalStyles,
        segment,
        overlaySvg,
        paragraphGroup,
        wordRect,
        cachedWidth: containerRect.width,
        cachedHeight: containerRect.height,
      });

      // Restore word highlight position if we have saved state (e.g., after hover/unhover cycle).
      // This prevents the word rect from re-animating from (0,0) when the overlay is destroyed
      // and recreated by the mediator's ownership cycling.
      const savedWord = SegmentHighlights.#savedWordState.get(element);
      if (savedWord && savedWord.marker === segment.marker) {
        wordRect.style.transition = "none";
        wordRect.style.x = savedWord.x;
        wordRect.style.y = savedWord.y;
        wordRect.style.width = savedWord.width;
        wordRect.style.height = savedWord.height;
        wordRect.style.opacity = savedWord.opacity;
        // Force reflow so the position applies immediately before re-enabling transitions
        wordRect.getBoundingClientRect();
        wordRect.style.transition = [
          `x ${WORD_TRANSITION_MS}ms ease-out`,
          `y ${WORD_TRANSITION_MS}ms ease-out`,
          `width ${WORD_TRANSITION_MS}ms ease-out`,
          `height ${WORD_TRANSITION_MS}ms ease-out`,
          `opacity ${WORD_TRANSITION_MS}ms ease-out`,
        ].join(", ");
        highlightData.currentWordIndex = savedWord.currentWordIndex;
      }
      SegmentHighlights.#savedWordState.delete(element);

      // Add click handler for click-to-seek or pause
      element.style.cursor = "pointer";
      const clickHandler = (event) => {
        const hd = SegmentHighlights.#activeHighlights.get(element);
        if (!hd) return;

        const wordIndex = SegmentHighlights.#findWordAtPoint(event.clientX, event.clientY, hd, element);
        if (wordIndex >= 0) {
          // Check if clicking on the currently playing word (only pause if actively playing)
          const isCurrentWord = wordIndex === hd.currentWordIndex && hd.currentWordIndex >= 0;

          if (isCurrentWord && hd.isPlaying) {
            // Stop propagation so listenToSegments doesn't also toggle play/pause
            event.stopPropagation();

            // Pause playback
            element.dispatchEvent(new CustomEvent("beyondwords-pause", {
              detail: { segment },
              bubbles: true,
            }));
          } else {
            // Let the click propagate so listenToSegments fires PressedSegment,
            // which makes rootController play the correct content item / segment.
            // Then dispatch seek asynchronously so it runs AFTER rootController
            // has handled the segment switch.
            const word = hd.wordRanges[wordIndex];
            const segmentStartTime = segment.startTime || 0;
            const seekTime = segmentStartTime + (word.start_time / 1000);

            setTimeout(() => {
              element.dispatchEvent(new CustomEvent("beyondwords-seek", {
                detail: { time: seekTime, segment, word },
                bubbles: true,
              }));
            }, 0);
          }
        }
      };
      element.addEventListener("click", clickHandler);
      SegmentHighlights.#clickHandlers.set(element, clickHandler);
    }
  }

  static #removeHighlights(uniqueId, self, segment) {
    for (const element of self.#highlightElements(segment)) {
      const state = SegmentHighlights.#elementState.get(element);
      if (state && state.uniqueId === uniqueId) {
        // Save word highlight state so it can be restored if the overlay is
        // immediately recreated (e.g., mediator cycling from hover/unhover).
        const highlightData = SegmentHighlights.#activeHighlights.get(element);
        if (highlightData && highlightData.currentWordIndex >= 0) {
          SegmentHighlights.#savedWordState.set(element, {
            marker: segment.marker,
            currentWordIndex: highlightData.currentWordIndex,
            x: state.wordRect.style.x,
            y: state.wordRect.style.y,
            width: state.wordRect.style.width,
            height: state.wordRect.style.height,
            opacity: state.wordRect.style.opacity,
          });
        } else {
          SegmentHighlights.#savedWordState.delete(element);
        }

        // Remove overlay SVG from DOM
        state.overlaySvg?.remove();

        // Restore original styles
        element.style.position = state.originalStyles.position;
        element.style.isolation = state.originalStyles.isolation;
        element.style.cursor = state.originalStyles.cursor;

        // Remove click handler
        const clickHandler = SegmentHighlights.#clickHandlers.get(element);
        if (clickHandler) {
          element.removeEventListener("click", clickHandler);
          SegmentHighlights.#clickHandlers.delete(element);
        }

        SegmentHighlights.#elementState.delete(element);
        SegmentHighlights.#activeHighlights.delete(element);
      }
    }
  }

  // Highlight the segmentElement and all DOM nodes with the same marker. There
  // might be an edge case where the segment was matched using (xpath, md5) and
  // the marker set on the DOM node does not match the one from the API. In this
  // case, pool all elements together anyway and highlight all of them.
  #highlightElements(segment) {
    const set = new Set([segment.segmentElement]);

    const marker1 = segment.marker;
    const marker2 = segment.segmentElement?.getAttribute("data-beyondwords-marker");

    for (const marker of [marker1, marker2].filter(m => m)) {
      const elements = document.querySelectorAll(`[data-beyondwords-marker="${marker}"]`);
      for (const element of elements) { set.add(element); }
    }

    return set;
  }
}

export default SegmentHighlights;
