#!/usr/bin/env python
import argparse
import asyncio
import glob
import json
import os
import sys
from datetime import datetime

# Add the src directory to the path to allow importing app modules
sys.path.append(os.path.join(os.path.dirname(__file__), "../src"))

from app.models import Answer, Question, User
from dotenv import load_dotenv
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

print(f"Using database URL: {DATABASE_URL}")
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Paths configuration - simpler now that seeds are at the project root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INITIAL_SEEDS = os.path.join(BASE_DIR, "initial")
UPDATE_SEEDS = os.path.join(BASE_DIR, "updates")
TEST_SEEDS = os.path.join(BASE_DIR, "tests")


def validate_question(item: dict) -> tuple[bool, str]:
    """
    Validate a question item to ensure it has exactly one correct answer.

    Args:
        item: Dictionary containing question data

    Returns:
        tuple: (is_valid, error_message)
    """
    question_text = item.get("question", "")
    if not question_text:
        return False, "Question text is missing"

    answers = item.get("answers", [])
    if not answers or len(answers) < 2:
        return False, f"Question '{question_text}' has insufficient answers"

    correct_answers = sum(1 for answer in answers if answer.get("correct"))
    if correct_answers == 0:
        return False, f"Question '{question_text}' has no correct answer"
    elif correct_answers > 1:
        return (
            False,
            f"Question '{question_text}' has {correct_answers} correct answers (should have exactly 1)",
        )

    return True, ""


async def find_record(session: AsyncSession, model: type, **kwargs) -> object | None:
    """
    Find a record by criteria and return it, or None if not found.

    Args:
        session: SQLAlchemy async session
        model: SQLAlchemy model class
        **kwargs: Filter criteria

    Returns:
        The first matching record or None if not found
    """
    stmt = select(model).filter_by(**kwargs)
    result = await session.execute(stmt)
    return result.scalars().first()


async def record_exists(session: AsyncSession, model: type, **kwargs) -> bool:
    """
    Check if a record exists with the given criteria.

    Args:
        session: SQLAlchemy async session
        model: SQLAlchemy model class
        **kwargs: Filter criteria

    Returns:
        True if a record exists, False otherwise
    """
    record = await find_record(session, model, **kwargs)
    return record is not None


async def seed_questions_from_file(
    session: AsyncSession, file_path: str, skip_existing: bool = True
) -> tuple[int, list, list]:
    """
    Seed questions from a JSON file.

    Args:
        session: SQLAlchemy async session
        file_path: Path to the JSON file containing questions
        skip_existing: If True, skip questions that already exist.
                      If False (--force flag), check existing questions and update them if needed.

    Returns:
        tuple: (total_changes, added_questions_details, updated_questions_details)
    """
    try:
        with open(file_path, "r") as f:
            data = json.load(f)

        added_questions = []
        updated_questions = []

        for item in data:
            # Validate question data
            is_valid, error_msg = validate_question(item)
            if not is_valid:
                print(f"❌ {error_msg} - Skipping this question.")
                continue

            question_text = item["question"]
            existing_question = await find_record(
                session, Question, question=question_text
            )

            # Handle existing questions
            if existing_question:
                if skip_existing:
                    print(f"Question '{question_text}' already exists. Skipping.")
                    continue
                else:
                    # Always check if we need to update the question
                    level = item.get("level", 10)
                    if level not in (10, 11, 12):
                        print(
                            f"Invalid level {level} for question '{question_text}'. Using default 10."
                        )
                        level = 10

                    # Fetch current answers
                    stmt = select(Answer).filter_by(question_id=existing_question.id)
                    result = await session.execute(stmt)
                    existing_answers = result.scalars().all()

                    # Check if we need to update
                    need_update = False
                    update_reasons = []

                    # Check if level has changed
                    if existing_question.level != level:
                        need_update = True
                        update_reasons.append(
                            f"level changed from {existing_question.level} to {level}"
                        )

                    # Check if answers have changed
                    if len(existing_answers) != len(item["answers"]):
                        need_update = True
                        update_reasons.append(
                            f"answer count changed from {len(existing_answers)} to {len(item['answers'])}"
                        )
                    else:
                        # Create a map of existing answers for faster lookup
                        existing_map = {(a.answer, a.correct) for a in existing_answers}
                        new_map = {(a["answer"], a["correct"]) for a in item["answers"]}

                        if existing_map != new_map:
                            need_update = True
                            update_reasons.append(
                                "answer content or correctness changed"
                            )

                    if need_update:
                        reasons = ", ".join(update_reasons)
                        print(
                            f"Question '{question_text}' has changes ({reasons}). Updating..."
                        )

                        # Delete associated answers
                        await session.execute(
                            delete(Answer).where(
                                Answer.question_id == existing_question.id
                            )
                        )

                        # Update the level of the existing question
                        existing_question.level = level
                        await session.flush()

                        # Add new answers
                        answer_objs = [
                            Answer(
                                question_id=existing_question.id,
                                answer=a["answer"],
                                correct=a["correct"],
                            )
                            for a in item["answers"]
                        ]
                        session.add_all(answer_objs)

                        # Store details about the updated question
                        updated_questions.append(
                            {
                                "question_text": question_text,
                                "level": level,
                                "reasons": reasons,
                                "answers_count": len(item["answers"]),
                                "correct_answer": next(
                                    (
                                        a["answer"]
                                        for a in item["answers"]
                                        if a["correct"]
                                    ),
                                    None,
                                ),
                            }
                        )
                    else:
                        print(
                            f"Question '{question_text}' already exists with identical data. No update needed."
                        )

                    continue

            # Get level from the item if available, else default to 10
            level = item.get("level", 10)
            if level not in (10, 11, 12):
                print(
                    f"Invalid level {level} for question '{question_text}'. Using default 10."
                )
                level = 10

            # Validate the question structure
            is_valid, validation_message = validate_question(item)
            if not is_valid:
                print(f"❌ {validation_message}. Skipping question.")
                continue

            q = Question(question=question_text, level=level)
            session.add(q)
            await session.flush()

            answer_objs = [
                Answer(question_id=q.id, answer=a["answer"], correct=a["correct"])
                for a in item["answers"]
            ]
            session.add_all(answer_objs)

            # Store details about the added question
            added_questions.append(
                {
                    "question_text": question_text,
                    "level": level,
                    "answers_count": len(item["answers"]),
                    "correct_answer": next(
                        (a["answer"] for a in item["answers"] if a["correct"]), None
                    ),
                }
            )

        return (
            len(added_questions) + len(updated_questions),
            added_questions,
            updated_questions,
        )
    except Exception as e:
        print(f"❌ Error seeding from {file_path}: {e}")
        return (0, [], [])


async def seed_initial_data(
    session: AsyncSession, skip_existing: bool = True
) -> tuple[int, list, list]:
    """
    Seed initial data from the initial seeds directory.

    Args:
        session: SQLAlchemy async session
        skip_existing: Whether to skip questions that already exist

    Returns:
        tuple: (total_changes, added_questions_details, updated_questions_details)
    """
    total_changes = 0
    added_questions_details = []
    updated_questions_details = []

    # Find all JSON files in the initial directory
    seed_files = glob.glob(os.path.join(INITIAL_SEEDS, "*.json"))

    for seed_file in seed_files:
        print(f"Seeding from {seed_file}...")
        changes, added, updated = await seed_questions_from_file(
            session, seed_file, skip_existing
        )
        total_changes += changes
        added_questions_details.extend(added)
        updated_questions_details.extend(updated)

    # Always make sure test_user exists
    if not await record_exists(session, User, username="test_user"):
        session.add(User(username="test_user"))
        print("Added test_user")

    return (total_changes, added_questions_details, updated_questions_details)


async def seed_update(
    session: AsyncSession, update_file: str, skip_existing: bool = False
) -> tuple[int, list, list]:
    """
    Seed data from a specific update file.
    For update files, we always check existing questions for differences and update if needed.

    Args:
        session: SQLAlchemy async session
        update_file: Path to the update file
        skip_existing: Whether to skip questions that already exist (default: False for update files)

    Returns:
        tuple: (total_changes, added_questions_details, updated_questions_details)
    """
    print(f"Applying update from {update_file}...")
    return await seed_questions_from_file(session, update_file, skip_existing)


async def seed_all_updates(
    session: AsyncSession, skip_existing: bool = False
) -> tuple[int, list, list]:
    """
    Seed all update files in order.
    For update files, we always check existing questions for differences and update if needed.

    Args:
        session: SQLAlchemy async session
        skip_existing: Whether to skip questions that already exist (default: False for update files)

    Returns:
        tuple: (total_changes, added_questions_details, updated_questions_details)
    """
    total_changes = 0
    added_questions_details = []
    updated_questions_details = []

    # Find all JSON files in the updates directory
    update_files = sorted(glob.glob(os.path.join(UPDATE_SEEDS, "*.json")))

    for update_file in update_files:
        changes, added, updated = await seed_update(session, update_file, skip_existing)
        total_changes += changes
        added_questions_details.extend(added)
        updated_questions_details.extend(updated)

    return (total_changes, added_questions_details, updated_questions_details)


async def seed_test_data(session: AsyncSession) -> tuple[int, list, list]:
    """
    Seed test data for testing environments.

    Args:
        session: SQLAlchemy async session

    Returns:
        tuple: (total_changes, added_questions_details, updated_questions_details)
    """
    total_changes = 0
    added_questions_details = []
    updated_questions_details = []

    # Find all JSON files in the test directory
    test_files = glob.glob(os.path.join(TEST_SEEDS, "*.json"))

    for test_file in test_files:
        print(f"Seeding test data from {test_file}...")
        changes, added, updated = await seed_questions_from_file(
            session, test_file, skip_existing=True
        )
        total_changes += changes
        added_questions_details.extend(added)
        updated_questions_details.extend(updated)

    return (total_changes, added_questions_details, updated_questions_details)


async def run_seeding(args: argparse.Namespace) -> None:
    """
    Run the seeding operations based on command line arguments.

    Args:
        args: Command line arguments from argparse
    """
    async with AsyncSessionLocal() as session:
        all_added_questions = []
        all_updated_questions = []

        if args.all:
            print("🌱 Seeding initial data...")
            _, added, updated = await seed_initial_data(session, not args.force)
            all_added_questions.extend(added)
            all_updated_questions.extend(updated)

            print("🌱 Seeding updates...")
            _, added, updated = await seed_all_updates(session, not args.force)
            all_added_questions.extend(added)
            all_updated_questions.extend(updated)

        elif args.initial:
            print("🌱 Seeding initial data...")
            _, added, updated = await seed_initial_data(session, not args.force)
            all_added_questions.extend(added)
            all_updated_questions.extend(updated)

        elif args.updates:
            print("🌱 Seeding all updates...")
            # Always check for updates, so setting skip_existing=False for update files
            _, added, updated = await seed_all_updates(session, skip_existing=False)
            all_added_questions.extend(added)
            all_updated_questions.extend(updated)

        elif args.update_file:
            print(f"🌱 Seeding from update file: {args.update_file}")
            # Always check for updates, so setting skip_existing=False for update files
            _, added, updated = await seed_update(
                session, args.update_file, skip_existing=False
            )
            all_added_questions.extend(added)
            all_updated_questions.extend(updated)

        elif args.test_data:
            print("🌱 Seeding test data...")
            _, added, updated = await seed_test_data(session)
            all_added_questions.extend(added)
            all_updated_questions.extend(updated)

        elif args.file:
            print(f"🌱 Seeding from file: {args.file}")
            _, added, updated = await seed_questions_from_file(
                session, args.file, not args.force
            )
            all_added_questions.extend(added)
            all_updated_questions.extend(updated)

        await session.commit()

        # Generate detailed seeding report
        added_count = len(all_added_questions)
        updated_count = len(all_updated_questions)

        print("\n✅ SEEDING REPORT")
        print("================")

        if added_count > 0:
            print(
                f"\n📝 Added {added_count} new question{'s' if added_count != 1 else ''}:"
            )
            for i, q in enumerate(all_added_questions, 1):
                print(f"  {i}. Level {q['level']}: \"{q['question_text']}\"")
                print(f"     Correct answer: \"{q['correct_answer']}\"")
                print(f"     Total answers: {q['answers_count']}")

        if updated_count > 0:
            print(
                f"\n🔄 Updated {updated_count} existing question{'s' if updated_count != 1 else ''}:"
            )
            for i, q in enumerate(all_updated_questions, 1):
                print(f"  {i}. Level {q['level']}: \"{q['question_text']}\"")
                print(f"     Reason: {q['reasons']}")
                print(f"     Correct answer: \"{q['correct_answer']}\"")
                print(f"     Total answers: {q['answers_count']}")

        if added_count == 0 and updated_count == 0:
            print(
                "\n📊 No changes were made (all questions already exist with identical data)"
            )

        print("\n================\n")


def create_update_file(name: str) -> str:
    """
    Create a new update seed file with today's date.

    Args:
        name: Name component for the file

    Returns:
        str: Path to the created file
    """
    today = datetime.now().strftime("%Y-%m-%d")
    filename = f"{today}-{name}.json"
    filepath = os.path.join(UPDATE_SEEDS, filename)

    # Create the updates directory if it doesn't exist
    os.makedirs(UPDATE_SEEDS, exist_ok=True)

    with open(filepath, "w") as f:
        f.write(
            '[\n  {\n    "question": "Sample question?",\n    "level": 10,\n    "answers": [\n      { "answer": "Correct answer", "correct": true },\n      { "answer": "Wrong answer 1", "correct": false },\n      { "answer": "Wrong answer 2", "correct": false },\n      { "answer": "Wrong answer 3", "correct": false }\n    ]\n  }\n]\n'
        )

    print(f"✅ Created new update seed file: {filepath}")
    return filepath


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Seed the database with questions and answers"
    )

    # Main operation modes - mutually exclusive
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--all", action="store_true", help="Run all seeding operations")
    group.add_argument(
        "--initial", action="store_true", help="Run only initial seeding"
    )
    group.add_argument("--updates", action="store_true", help="Run all update seeds")
    group.add_argument("--update-file", type=str, help="Run a specific update file")
    group.add_argument("--file", type=str, help="Seed from a specific file")
    group.add_argument("--test-data", action="store_true", help="Seed with test data")
    group.add_argument("--create", type=str, help="Create a new update seed file")

    # Options
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force check and update records that already exist (only affects initial data, not update files)",
    )

    args = parser.parse_args()

    # Handle creating a new update file
    if args.create:
        create_update_file(args.create)
    else:
        # Run the seeding operations
        asyncio.run(run_seeding(args))
