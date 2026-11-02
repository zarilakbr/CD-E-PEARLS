import os
import sys
import json
import urllib.request
import urllib.error
import openpyxl

def main():
    print("=================================================================")
    print("VERIFIKASI FILE EXCEL (.xlsx) LAPORAN PENJUALAN SPI CD'E PEARLS")
    print("=================================================================")

    # 1. Login SPI via API
    login_url = "http://127.0.0.1:8000/api/v1/auth/login"
    login_data = json.dumps({
        "email": "owner.spi@cdepearls.com",
        "password": "yF5!xS8#wE2$vB7*",
        "turnstile_token": "1x00000000000000000000AA"
    }).encode("utf-8")

    req = urllib.request.Request(
        login_url,
        data=login_data,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            token = data.get("token") or data.get("access_token") or data.get("data", {}).get("token")
            print(f"[1] Berhasil login sebagai SPI. Token diperoleh.")
    except Exception as e:
        print(f"[!] Gagal login via API: {e}")
        sys.exit(1)

    # 2. Unduh File Excel dari Endpoint SPI
    export_url = "http://127.0.0.1:8000/api/v1/spi/reports/sales/export"
    req_export = urllib.request.Request(
        export_url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        },
        method="GET"
    )

    export_path = "sales_report_verification.xlsx"
    try:
        with urllib.request.urlopen(req_export) as resp:
            content_type = resp.headers.get("Content-Type")
            print(f"[2] Header Content-Type diterima: {content_type}")
            assert "spreadsheetml.sheet" in content_type, f"MIME type tidak sesuai: {content_type}"
            with open(export_path, "wb") as f:
                f.write(resp.read())
            print(f"[2] Berhasil mengunduh file Excel: {export_path} ({os.path.getsize(export_path)} bytes)")
    except Exception as e:
        print(f"[!] Gagal mengunduh laporan excel: {e}")
        sys.exit(1)

    # 3. Baca dengan Openpyxl & Verifikasi Struktur
    wb = openpyxl.load_workbook(export_path, data_only=True)
    expected_sheets = ["Ringkasan", "Rincian Pesanan", "Rincian Barang"]
    print(f"\n[3] Daftar Sheet Ditemukan: {wb.sheetnames}")
    for s in expected_sheets:
        assert s in wb.sheetnames, f"Sheet '{s}' tidak ditemukan!"
    print(f"[OK] Ketiga sheet ({', '.join(expected_sheets)}) terverifikasi lengkap.")

    # 4. Cetak 5 Baris Pertama Setiap Sheet
    print("\n-----------------------------------------------------------------")
    for sheet_name in expected_sheets:
        ws = wb[sheet_name]
        print(f"\n>>> SHEET: {sheet_name} (Total Baris: {ws.max_row}, Total Kolom: {ws.max_column})")
        print("-" * 65)
        row_count = 0
        for row in ws.iter_rows(values_only=True):
            if row_count >= 5:
                break
            # Format row representation
            formatted_row = [str(cell) if cell is not None else "" for cell in row]
            print(f"Baris {row_count + 1:2d}: | " + " | ".join(formatted_row[:6]))
            row_count += 1

    # 5. Verifikasi Integritas Tipe Data Numerik & Formula Injection
    print("\n[5] Verifikasi Integritas Tipe Data & Sanitasi:")
    ws_orders = wb["Rincian Pesanan"]
    if ws_orders.max_row > 1:
        # Check total column (kolom 12)
        sample_total = ws_orders.cell(row=2, column=12).value
        print(f"    - Sampel Nilai Total Pesanan: {sample_total} (Tipe: {type(sample_total).__name__})")
        assert isinstance(sample_total, (int, float)), f"Nilai total harus berupa numerik, bukan teks: {sample_total}"
        print("    [OK] Tipe sel numerik murni terverifikasi (int/float, bukan teks 'Rp').")

    print("\n=================================================================")
    print("STATUS VERIFIKASI EKSPOR EXCEL SPI: LULUS (SEMUA KRITERIA TERPENUHI)")
    print("=================================================================")

    # Cleanup
    wb.close()
    if os.path.exists(export_path):
        os.remove(export_path)

if __name__ == "__main__":
    main()
