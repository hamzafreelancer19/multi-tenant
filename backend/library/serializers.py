from datetime import date

from rest_framework import serializers

from .models import Book, IssueReturn


class BookSerializer(serializers.ModelSerializer):
    issued_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Book
        fields = "__all__"
        read_only_fields = ["school", "accession_no"]
        extra_kwargs = {
            "isbn": {"allow_blank": True, "required": False},
            "publisher": {"allow_blank": True, "required": False},
            "language": {"allow_blank": True, "required": False},
            "shelf_no": {"allow_blank": True, "required": False},
            "notes": {"allow_blank": True, "required": False},
        }

    def validate(self, attrs):
        qty = attrs.get("quantity", getattr(self.instance, "quantity", 1))
        avail = attrs.get("available_quantity", getattr(self.instance, "available_quantity", qty))
        if qty is not None and int(qty) < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        if avail is not None and int(avail) < 0:
            raise serializers.ValidationError("Available copies cannot be negative.")
        if qty is not None and avail is not None and int(avail) > int(qty):
            raise serializers.ValidationError("Available copies cannot exceed total quantity.")
        return attrs


class IssueReturnSerializer(serializers.ModelSerializer):
    book_title = serializers.ReadOnlyField(source="book.title")
    book_author = serializers.ReadOnlyField(source="book.author")
    student_name = serializers.ReadOnlyField(source="student.name")
    student_class = serializers.ReadOnlyField(source="student.class_name")
    student_roll = serializers.ReadOnlyField(source="student.roll_no")
    due_status = serializers.SerializerMethodField()

    class Meta:
        model = IssueReturn
        fields = "__all__"
        read_only_fields = ["school", "issued_by"]
        extra_kwargs = {
            "remarks": {"allow_blank": True, "required": False},
            "return_date": {"required": False, "allow_null": True},
        }

    def get_due_status(self, obj):
        if obj.status == "Returned":
            return "Returned"
        if obj.status == "Lost":
            return "Lost"
        if obj.due_date and obj.due_date < date.today():
            return "Overdue"
        return "Issued"

    def validate(self, attrs):
        issue_date = attrs.get("issue_date", getattr(self.instance, "issue_date", None))
        due_date = attrs.get("due_date", getattr(self.instance, "due_date", None))
        if issue_date and due_date and due_date < issue_date:
            raise serializers.ValidationError("Due date cannot be before issue date.")
        return attrs
