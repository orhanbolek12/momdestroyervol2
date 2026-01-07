from PIL import Image
import os

def remove_white_background(input_path, output_path, threshold=200):
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Check if pixel is white-ish
            if item[0] > threshold and item[1] > threshold and item[2] > threshold:
                newData.append((255, 255, 255, 0)) # Transparent
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Processed: {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

# Paths
tuna_src = r"C:/Users/orhan.bolek/.gemini/antigravity/brain/686a72dd-19bb-4d8e-b6fb-343944eb4669/uploaded_image_0_1767808771820.png"
flashbang_src = r"C:/Users/orhan.bolek/.gemini/antigravity/brain/686a72dd-19bb-4d8e-b6fb-343944eb4669/uploaded_image_1_1767808771820.png"

tuna_dest = r"c:\Users\orhan.bolek\.gemini\antigravity\scratch\flash_tuna_site\assets\tuna.png"
flashbang_dest = r"c:\Users\orhan.bolek\.gemini\antigravity\scratch\flash_tuna_site\assets\flashbang.png"

# Process
print("Starting background removal...")
remove_white_background(tuna_src, tuna_dest, threshold=220)
remove_white_background(flashbang_src, flashbang_dest, threshold=220)
print("Done.")
