#!/bin/bash
# scripts/test_api.sh

API="http://localhost:8000/api"

# Génération aléatoire
RANDOM_ID=$(date +%s)
USERNAME="testuser_$RANDOM_ID"
EMAIL="testuser_$RANDOM_ID@test.com"
PASSWORD="supersecure123"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_section() {
    echo ""
    echo -e "${YELLOW}=== $1 ===${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo -e "${YELLOW}Utilisateur généré :${NC}"
echo "Username: $USERNAME"
echo "Email: $EMAIL"

# --- Test 1 : Register ---
print_section "Test 1: Création d'un user (register)"

RESPONSE=$(curl -s -X POST $API/auth/register/ \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "Réponse :"
echo "$RESPONSE" | python3 -m json.tool

if echo "$RESPONSE" | grep -q '"access"'; then
    print_success "User créé avec succès"

    TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access'])")

    REFRESH_TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['refresh'])")

else
    print_error "Échec de la création"
    exit 1
fi

# --- Test 2 : Login ---
print_section "Test 2: Login"

RESPONSE=$(curl -s -X POST $API/auth/login/ \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\"
  }")

echo "Réponse :"
echo "$RESPONSE" | python3 -m json.tool

if echo "$RESPONSE" | grep -q '"access"'; then
    print_success "Login réussi"

    TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access'])")

    REFRESH_TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['refresh'])")

else
    print_error "Échec du login"
    exit 1
fi

# --- Test 3 : Profil ---
print_section "Test 3: Récupérer son profil"

curl -s $API/users/me/ \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# --- Test 4 : Modifier profil ---
print_section "Test 4: Modifier sa bio"

curl -s -X PATCH $API/users/me/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "I love coding!",
    "display_name": "Test User"
  }' | python3 -m json.tool

# --- Test 5 : Accès sans token ---
print_section "Test 5: Accès sans token (doit échouer)"

RESPONSE=$(curl -s $API/users/me/)

echo "Réponse :"
echo "$RESPONSE" | python3 -m json.tool

if echo "$RESPONSE" | grep -q "Authentication credentials"; then
    print_success "Accès refusé correctement"
else
    print_error "L'API n'a pas refusé l'accès"
fi

# --- Test 6 : Logout ---
print_section "Test 6: Logout"

RESPONSE=$(curl -s -X POST $API/auth/logout/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"refresh\": \"$REFRESH_TOKEN\"
  }")

echo "Réponse :"
echo "$RESPONSE" | python3 -m json.tool

if echo "$RESPONSE" | grep -q "Logout successful"; then
    print_success "Logout réussi"
else
    print_error "Échec du logout"
fi

# --- Test 7 : Vérifier refresh token blacklisté ---
print_section "Test 7: Vérifier refresh token blacklisté"

RESPONSE=$(curl -s -X POST $API/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d "{
    \"refresh\": \"$REFRESH_TOKEN\"
  }")

echo "Réponse :"
echo "$RESPONSE" | python3 -m json.tool

if echo "$RESPONSE" | grep -q "blacklisted"; then
    print_success "Refresh token blacklisté correctement"
else
    print_error "Le refresh token fonctionne encore"
fi

echo ""
echo -e "${GREEN}========================${NC}"
echo -e "${GREEN} Tests terminés !${NC}"
echo -e "${GREEN}========================${NC}"