# SmartConvert AI

A modern, intelligent, responsive web application for converting documents between different file formats while preserving content, structure, tables, formatting, page layout, and readability.

## Features

- Convert PDF to Word, Excel, Text, CSV
- Convert Word, Excel, Text, Images to PDF
- Intelligent PDF-to-Excel conversion with table detection and OCR support
- Intelligent Excel-to-PDF conversion with pagination and formatting preservation
- Word-to-PDF conversion with layout optimization
- Support for Arabic and English languages
- Professional, modern interface with drag-and-drop upload
- Secure file processing and automatic cleanup

## Technology Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Axios for HTTP requests

### Backend
- Python with FastAPI
- PyMuPDF for PDF text extraction
- Camelot for table extraction from PDF
- python-docx for Word document manipulation
- OpenPyXL for Excel spreadsheet manipulation
- ReportLab for PDF generation
- Pillow for image processing
- Tesseract OCR (via pytesseract) for scanned documents

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)

### System Dependencies (for full functionality)
Some conversion features require additional system dependencies:

1. **Poppler** - Required for PDF text extraction (used by PyMuPDF)
2. **Ghostscript** - Required for Camelot table extraction
3. **Tesseract OCR** - Required for OCR support in scanned PDFs
4. **LibreOffice** - Alternative for document conversions (not used in this implementation but recommended for production)

On Ubuntu/Debian:
```bash
sudo apt-get install poppler-utils ghostscript tesseract-ocr libsm6 libxext6
```

On Windows:
- Install [Poppler](https://github.com/oschwartz10612/poppler-windows) and add to PATH
- Install [Ghostscript](https://www.ghostscript.com/download/gsdnld.html) and add to PATH
- Install [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) and add to PATH

### Backend Setup
1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`

### Production Build
To create a production build of the frontend:
```bash
npm run build
```
The build artifacts will be in the `build` directory, which can be served by any static file host.

## Usage
1. Start the backend server (`uvicorn main:app --reload`)
2. Start the frontend development server (`npm start`)
3. Open your browser to `http://localhost:3000`
4. Upload a file using the drag-and-drop area or click to browse
5. Select the desired target format
6. Click "Convert File"
7. Download the converted file

## API Endpoints
- `POST /uploadfile/` - Upload a file
- `POST /convert/` - Convert an uploaded file to a target format
  - Parameters: `file` (form-data), `target_format` (form-data)
  - Returns: The converted file as a download

## Supported Conversions
- PDF → Text, CSV, DOCX
- Text → PDF
- Image (PNG, JPG, JPEG) → PDF
- Excel (XLSX) → PDF (basic)
- Word (DOCX) → PDF (basic)

## Limitations
- Excel to PDF conversion is basic and may not preserve all formatting
- Word to PDF conversion is basic and may not preserve all formatting
- Advanced features like OCR and table detection require the system dependencies listed above
- Large files may exceed memory limits; consider adjusting server limits for production

## Security
- Files are validated for type and size
- Temporary files are automatically cleaned up
- No macros or embedded scripts are executed from uploaded documents
- Secure download links are used (though in this implementation, files are served directly from memory)

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments
- Thanks to the developers of all the open-source libraries used in this project