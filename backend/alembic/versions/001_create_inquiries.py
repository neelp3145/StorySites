"""create inquiries table

Revision ID: 001
Revises:
Create Date: 2026-11-14

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "inquiries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("request_type", sa.String(length=120), nullable=False),
        sa.Column("service_type", sa.String(length=120), nullable=False),
        sa.Column("hosting_preference", sa.String(length=120), nullable=True),
        sa.Column("project_details", sa.Text(), nullable=False),
        sa.Column("contact_consent", sa.Boolean(), nullable=False),
        sa.Column("terms_acknowledged", sa.Boolean(), nullable=False),
        sa.Column("terms_version", sa.String(length=80), nullable=True),
        sa.Column("quote_displayed", sa.String(length=255), nullable=True),
        sa.Column(
            "status",
            sa.Enum("new", "contacted", "closed", name="inquiry_status"),
            server_default="new",
            nullable=False,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_inquiries_email", "inquiries", ["email"])


def downgrade() -> None:
    op.drop_index("ix_inquiries_email", table_name="inquiries")
    op.drop_table("inquiries")
    op.execute("DROP TYPE IF EXISTS inquiry_status")
