# ActorListCommands — Core List Context

`ActorListCommand`s express intent to change a List, issued by an identifiable Actor. They are validated before application — a rejected command returns an error and emits no ListEvents.

---

## ActorCommand (abstract)

All commands extend this base type:

```
ActorCommand {
  actorId: ActorId   // who is issuing this command
}
```

## ActorListCommand (abstract)

All list context commands extend this base type:

```
ActorListCommand extends ActorCommand {
  listId:  ListId    // the target List
}
```

---

## CreateList

```
CreateList extends ActorCommand {
  title?: string   // optional display name for the List
  listId?: ListId
}
```

`listId` is optional, the caller can define it but if not defined the handler will generate it.

**Handled by:** `List.create(cmd): ListCreated`
**Rejects when:** `listId` is not a valid ListId format.

---

## AddListElement

```
AddListElement extends ActorListCommand {
  content: ListElementContent   // validated non-empty before issuing
}
```

**Handled by:** `List.addListElement(cmd): ListElementAdded`
**Rejects when:** `content` is empty after trimming.

---

## DeleteListElement

```
DeleteListElement extends ActorListCommand {
  listElementId: ListElementId
}
```

**Handled by:** `List.deleteListElement(cmd): ListElementDeleted`
**Rejects when:** `listElementId` does not exist in the current List state.

---

## ExportListDocument

```
ExportListDocument extends ActorListCommand {
  // no additional fields
}
```

**Handled by:** `List.exportListDocument(cmd): [AlistigoDocument, ListExported]`
**Rejects when:** never — export is always valid.
