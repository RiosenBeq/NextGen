import pandas as pd
import sys
import os

# Add local packages to path
sys.path.append('./.python_packages')

xl_path = 'NextGenBox - Tablo_Hesaplama.xlsx'
xl = pd.ExcelFile(xl_path)

sql_statements = [
    # 1. Create Tables
    """CREATE TABLE IF NOT EXISTS "SystemParameter" (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value DOUBLE PRECISION NOT NULL
    );""",
    """CREATE TABLE IF NOT EXISTS "Location" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        "fixedRent" DOUBLE PRECISION NOT NULL,
        "duesAmount" DOUBLE PRECISION NOT NULL,
        "rentVatRate" DOUBLE PRECISION NOT NULL,
        "revenueShareRate" DOUBLE PRECISION DEFAULT 0,
        "revenueThreshold" DOUBLE PRECISION DEFAULT 0,
        "isActive" BOOLEAN DEFAULT TRUE
    );""",
    """CREATE TABLE IF NOT EXISTS "MonthlyPerformance" (
        id TEXT PRIMARY KEY,
        "locationId" TEXT NOT NULL REFERENCES "Location"(id) ON DELETE CASCADE,
        month TIMESTAMP NOT NULL,
        "sessionCount" DOUBLE PRECISION NOT NULL,
        "extraExpenseAmount" DOUBLE PRECISION DEFAULT 0,
        "extraExpenseNotes" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );""",
    """CREATE TABLE IF NOT EXISTS "Expense" (
        id TEXT PRIMARY KEY,
        "locationId" TEXT REFERENCES "Location"(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        type TEXT,
        "amountWithoutVat" DOUBLE PRECISION NOT NULL,
        "isOfficial" BOOLEAN DEFAULT FALSE,
        "vatRate" DOUBLE PRECISION DEFAULT 0,
        "amountWithVat" DOUBLE PRECISION NOT NULL,
        month TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );""",
    """CREATE TABLE IF NOT EXISTS "Investment" (
        id TEXT PRIMARY KEY,
        "locationId" TEXT NOT NULL REFERENCES "Location"(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        currency TEXT DEFAULT 'TL',
        "amountWithoutVat" DOUBLE PRECISION NOT NULL,
        "paymentType" TEXT DEFAULT 'Nakit',
        "vatAmount" DOUBLE PRECISION DEFAULT 0,
        "totalAmount" DOUBLE PRECISION NOT NULL,
        "shareLogic" TEXT,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );"""
]

def escape_str(s):
    if s is None or pd.isna(s): return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

# 1. Clear existing non-essential data
sql_statements.append("TRUNCATE TABLE \"Investment\" CASCADE;")
sql_statements.append("TRUNCATE TABLE \"Expense\" CASCADE;")
sql_statements.append("TRUNCATE TABLE \"MonthlyPerformance\" CASCADE;")
sql_statements.append("TRUNCATE TABLE \"Location\" CASCADE;")
sql_statements.append("TRUNCATE TABLE \"SystemParameter\" CASCADE;")

# 2. Locations (AVM_Detay)
# Row 1 is header (AVM Adı, Kira, Aidat...), Row 2-3 are data
df_avm = pd.read_excel(xl, 'AVM_Detay', skiprows=1)
location_map = {} # Name -> ID

for _, row in df_avm.iterrows():
    name = str(row.iloc[0]).strip()
    if pd.isna(row.iloc[0]) or "SABİT" in name or "AVM Adı" in name: continue
    
    try:
        rent = float(row.iloc[1]) if not pd.isna(row.iloc[1]) else 0
        dues = float(row.iloc[2]) if not pd.isna(row.iloc[2]) else 0
        share_rate = float(row.iloc[3]) if not pd.isna(row.iloc[3]) else 0
        threshold = float(row.iloc[4]) if not pd.isna(row.iloc[4]) else 0
        
        loc_id = f"loc_{name.lower().replace(' ', '_')}"
        location_map[name] = loc_id
        
        sql = f"INSERT INTO \"Location\" (id, name, \"fixedRent\", \"duesAmount\", \"rentVatRate\", \"revenueShareRate\", \"revenueThreshold\", \"isActive\") VALUES ('{loc_id}', {escape_str(name)}, {rent}, {dues}, 20, {share_rate}, {threshold}, true);"
        sql_statements.append(sql)
    except Exception as e:
        print(f"Skipping AVM row due to error: {e}")
        continue

# 3. System Parameters
df_params = pd.read_excel(xl, 'Parametreler', skiprows=1)
param_map = {
    'Oturum Fiyatı (KDV Dahil)': 'SESSION_PRICE_INCL_VAT',
    'KDV Oranı': 'VAT_RATE',
    'Komisyon Oranı': 'COMMISSION_RATE',
    'Kurumlar Vergisi Oranı': 'CORP_TAX_RATE',
    'Alp Payı': 'ALP_SHARE_RATE',
    'NextGenBox Payı': 'NGB_SHARE_RATE'
}

for _, row in df_params.iterrows():
    p_name = str(row.iloc[0]).strip()
    p_val_raw = row.iloc[1]
    if p_name in param_map:
        try:
            if isinstance(p_val_raw, str):
                val = float(p_val_raw.split()[0].replace('%', '').replace(',', '.'))
            else:
                val = float(p_val_raw)
            
            if p_name == 'Komisyon Oranı' and val < 1: val *= 100
            
            sql = f"INSERT INTO \"SystemParameter\" (id, key, value) VALUES ('param_{param_map[p_name].lower()}', '{param_map[p_name]}', {val}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;"
            sql_statements.append(sql)
        except:
            continue

# 4. Monthly Performances (Veri_Girisi)
df_perf = pd.read_excel(xl, 'Veri_Girisi', skiprows=3)
for _, row in df_perf.iterrows():
    month_str = str(row.iloc[0]).strip()
    avm_name = str(row.iloc[1]).strip()
    sessions = row.iloc[2]
    extra_cost = row.iloc[4]
    notes = row.iloc[5]
    
    if pd.isna(row.iloc[0]) or avm_name not in location_map: continue
    
    try:
        date_obj = pd.to_datetime(month_str + "-01")
        date_iso = date_obj.strftime('%Y-%m-%d %H:%M:%S')
        
        sql = f"INSERT INTO \"MonthlyPerformance\" (id, \"locationId\", month, \"sessionCount\", \"extraExpenseAmount\", \"extraExpenseNotes\") VALUES ('perf_{month_str}_{location_map[avm_name]}', '{location_map[avm_name]}', '{date_iso}', {float(sessions) if not pd.isna(sessions) else 0}, {float(extra_cost) if not pd.isna(extra_cost) else 0}, {escape_str(notes)});"
        sql_statements.append(sql)
    except:
        continue

# 5. Expenses (Giderler)
df_exp = pd.read_excel(xl, 'Giderler', skiprows=3)
for _, row in df_exp.iterrows():
    desc = str(row.iloc[0]).strip()
    amount_raw = row.iloc[1]
    
    # Filter out headers and empty rows
    if pd.isna(row.iloc[0]) or "Gider Adı" in desc or "TOPLAM" in desc or "Parametre" in desc: continue
    
    try:
        amount = float(amount_raw)
        is_official = str(row.iloc[2]).strip().upper() == "EVET"
        loc_alias = row.iloc[4]
        exp_type = str(row.iloc[7]).strip() if not pd.isna(row.iloc[7]) else "aylık"
        month_val = row.iloc[9] 
        
        if "Tarih" in str(month_val) or "Frekans" in exp_type: continue

        loc_id = "NULL"
        if not pd.isna(loc_alias):
            if "Bursa" in str(loc_alias): loc_id = f"'{location_map['Bursa Zafer Plaza']}'"
            elif "Mavi" in str(loc_alias) or "İzmir" in str(loc_alias): loc_id = f"'{location_map['Mavibahçe']}'"
        
        sql = f"INSERT INTO \"Expense\" (id, \"locationId\", description, type, \"amountWithoutVat\", \"isOfficial\", \"amountWithVat\", month) VALUES ('exp_{abs(hash(desc+str(amount)+str(month_val)))}', {loc_id}, {escape_str(desc)}, {escape_str(exp_type)}, {amount}, {str(is_official).lower()}, {amount}, {escape_str(month_val)});"
        sql_statements.append(sql)
    except:
        continue

# 6. Investments (Yatirim)
df_inv = pd.read_excel(xl, 'Yatirim', skiprows=2)
current_loc = None
for _, row in df_inv.iterrows():
    col1 = str(row.iloc[0]).strip()
    if pd.isna(row.iloc[0]) or "Kalem" in col1: continue
    
    if "BURSA" in col1.upper(): current_loc = location_map['Bursa Zafer Plaza']
    elif "MAVİ" in col1.upper() or "İZMİR" in col1.upper(): current_loc = location_map['Mavibahçe']
    
    if "Toplam" in col1 or current_loc is None or col1 in location_map: continue
    
    item = col1
    currency = str(row.iloc[1])
    amount_net_raw = row.iloc[2]
    amount_tl_raw = row.iloc[8]
    notes = row.iloc[9]
    
    try:
        amount_tl = float(amount_tl_raw)
        amount_net = float(amount_net_raw) if not pd.isna(amount_net_raw) else 0
        
        sql = f"INSERT INTO \"Investment\" (id, \"locationId\", description, currency, \"amountWithoutVat\", \"totalAmount\", notes) VALUES ('inv_{abs(hash(item+str(amount_tl)))}', '{current_loc}', {escape_str(item)}, {escape_str(currency)}, {amount_net}, {amount_tl}, {escape_str(notes)});"
        sql_statements.append(sql)
    except:
        continue

# Write to file
with open('migration.sql', 'w') as f:
    f.write("\n".join(sql_statements))

print(f"Generated {len(sql_statements)} statements in migration.sql")
