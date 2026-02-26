# youwont.api

## api
```txt
cmd/
└── api/
    └── main.go    
```
[main.go](cmd/api/main.go) represents the startup file (the file that actually runs!) The dependencies are injected, the echo server is started and the endpoints are defined.

## domain
```txt
internal/
└── domain/
    └── user_model.go    
```
[user_model.go](internal/domain/user_model.go) represents the business logic objects of the app alongside the data objects (no point in seperating them in youwont's usecase).

## dtos
```txt
internal/
└── domain/
└── dto/
    └── user_dto.go
```
[user_dto.go](internal/dto/user_dto.go) represents the data transfer objects of the app. Will be mapped to domain models in the service layer (used if there is some data that is unnecessary/should be hidden from the frontend).

## handlers
```txt
internal/
└── domain/
└── dto/
└── handler/
    └── handler.go
```
[handler.go](internal/handler/handler.go) is the handler or controller of the app. The API endpoints will be defined in the [main.go](cmd/api/main.go) but the actual functions are called from here to seperate concerns. The handler then connects to the service layer.

## services
```txt
internal/
└── domain/
└── dto/
└── handler/
└── service/
    └── service.go
```
[service.go](internal/service/service.go) this is the business logic layer, mainly deals with mapping dtos to domain/data objects but as we need more business logic here is where it will go.

## repositories
```txt
internal/
└── domain/
└── dto/
└── handler/
└── service/
└── repository/
    └── repository.go
```
[repositroy.go](internal/repository/repository.go) serves as the connection point between the app and the database (data layer) when the service layer needs to operate (CRUD) on the database, will just call repository functions.

## integrations
```txt
internal/
└── domain/
└── dto/
└── handler/
└── service/
└── repository/
└── integration/
```
[integration/](internal/integration/) will be the location of any future integrations for youwont (venmo/Strip integrations). TODO

## integrations
```txt
internal/
└── domain/
└── dto/
└── handler/
└── service/
└── repository/
└── integration/
```
[secrets/](secrets/) is a folder that is gitignored but contains text files of the connectionstrings and passwords until there is a better method for secure storage.








- _These are examples, in the future we can probably have seperate handlers/services/repos for each main set of functionality._