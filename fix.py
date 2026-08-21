import sys
with open('src/features/access/access-template.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\\"', '"').replace('\\n', '\n')

with open('src/features/access/access-template.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
