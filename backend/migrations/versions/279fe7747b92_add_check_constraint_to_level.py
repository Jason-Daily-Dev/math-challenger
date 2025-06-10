"""add check constraint to level

Revision ID: 279fe7747b92
Revises: 481d8058e430
Create Date: 2025-06-08 17:05:31.761014

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "279fe7747b92"
down_revision: Union[str, None] = "481d8058e430"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add check constraint for level column
    op.create_check_constraint(
        "check_valid_level", "questions", sa.text("level IN (10, 11, 12)")
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove check constraint
    op.drop_constraint("check_valid_level", "questions", type_="check")
