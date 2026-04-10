import os
import uuid
from pathlib import Path

from django.conf import settings
from django.core.files import File

from pypdf import PdfReader, PdfWriter


def merge_uploaded_pdfs(order, uploadedfile_qs):
    """Merge a queryset/list of UploadedFile instances (PDFs) preserving order.
    Returns the created UploadedFile instance for the merged PDF.
    """
    media_root = Path(settings.MEDIA_ROOT)
    merged_dir = media_root / "merged"
    merged_dir.mkdir(parents=True, exist_ok=True)

    out_name = f"{order.reference}_labels_{uuid.uuid4().hex[:8]}.pdf"
    out_path = merged_dir / out_name

    writer = PdfWriter()
    for uf in uploadedfile_qs:
        try:
            src = Path(uf.file.path)
            reader = PdfReader(str(src))
            for page in reader.pages:
                writer.add_page(page)
        except Exception:
            continue

    with open(out_path, "wb") as fout:
        writer.write(fout)

    # create UploadedFile record
    from ..models import UploadedFile

    merged_file = UploadedFile.objects.create(
        order=order,
        file=str(out_path.relative_to(media_root)),
        file_type="application/pdf",
    )

    with open(out_path, "rb") as f:
        merged_file.file.save(out_name, File(f), save=True)

    return merged_file
